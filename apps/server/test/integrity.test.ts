import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import { testDatabase } from "./database.js";

let db: Awaited<ReturnType<typeof testDatabase>>;
let app: FastifyInstance;
let prisma: PrismaClient;
let systemQuery: <T>(run: () => Promise<T>) => Promise<T>;
let ownerToken: string;
let guestToken: string;
let tableId: string;
let dishId: string;
let orderId: string;
let itemId: string;

before(async () => {
  db = await testDatabase();
  ({ prisma, systemQuery } = await import("../src/core/database/prismaClient.js"));
  const { buildApp } = await import("../src/app.js");
  process.env.PAYMENT_WEBHOOK_SECRET = "isolated-bank-webhook-test-secret-2026";
  app = await buildApp({ logger: false, sockets: false });
  await systemQuery(async () => {
    const passwordHash = await bcrypt.hash("OwnerSecureTest123", 4);
    for (const storeId of ["test-A", "test-B"]) {
      await prisma.store.create({ data: { id: storeId, name: storeId, slug: storeId } });
      await prisma.storeLicense.create({ data: { storeId, licenseKey: "license-" + storeId, endDate: new Date(Date.now() + 86400000), enabledModules: "CORE_POS,MODULE_QR_ORDER,MODULE_KDS,MODULE_ADVANCED_ANALYTICS,MODULE_ATTENDANCE_HRM,MODULE_STAFF_INTERCOM,MODULE_LANDING_PAGE" } });
      await prisma.staff.create({ data: { id: "owner-" + storeId, storeId, name: "Owner", email: storeId.toLowerCase() + "@example.com", passwordHash, role: "STORE_OWNER" } });
    }
    const zone = await prisma.tableZone.create({ data: { storeId: "test-A", name: "Main" } });
    const table = await prisma.table.create({ data: { storeId: "test-A", zoneId: zone.id, name: "Bàn 01", code: "TB-01" } }); tableId = table.id;
    const category = await prisma.category.create({ data: { storeId: "test-A", name: "Menu" } });
    const dish = await prisma.menuItem.create({ data: { storeId: "test-A", categoryId: category.id, name: "Bún Chả Hà Nội", price: 10000, costPrice: 3000, stockCount: 20 } }); dishId = dish.id;
  });
  const login = await app.inject({ method: "POST", url: "/api/auth/login-owner", payload: { email: "test-A@example.com", password: "OwnerSecureTest123" } });
  assert.equal(login.statusCode, 200, login.body); ownerToken = login.json().token;
});
after(async () => { if (app) await app.close(); if (prisma) await prisma.$disconnect(); if (db) await db.cleanup(); });

const headers = (key: string, token = ownerToken) => ({ authorization: "Bearer " + token, "x-idempotency-key": key });

test("anonymous administration is denied", async () => {
  for (const [method, url, payload] of [["GET", "/api/staff", undefined], ["POST", "/api/staff/owner-test-A/reset-credentials", { password: "Compromised123" }], ["GET", "/api/licenses", undefined]] as const) {
    const response = await app.inject({ method, url, payload }); assert.equal(response.statusCode, 401, response.body);
  }
});
test("cross-tenant reads and writes are denied", async () => {
  const response = await app.inject({ method: "GET", url: "/api/menu/test-B", headers: headers("tenant-read") });
  assert.equal(response.statusCode, 403, response.body);
});
test("opening a table is transactional and repeatable", async () => {
  const [one, two] = await Promise.all([1, 2].map(i => app.inject({ method: "POST", url: "/api/tables/test-A/session/approve", headers: headers("session-open-" + i), payload: { tableId, guestCount: 2 } })));
  assert.equal(one.statusCode, 200, one.body); assert.equal(two.statusCode, 200, two.body);
  assert.equal(one.json().data.sessionId, two.json().data.sessionId);
  assert.equal(await systemQuery(() => prisma.orderSession.count({ where: { tableId, status: "ACTIVE" } })), 1);
  guestToken = app.jwt.sign({ userId: "guest-test", kind: "customer", role: "CUSTOMER", storeId: "test-A", tableId, sessionId: one.json().data.sessionId }, { expiresIn: "1h" });
});
test("orders calculate trusted prices and concurrent retries create one batch", async () => {
  const payload = { storeId: "test-A", tableId, items: [{ dishId, name: "Fake", price: 1, quantity: 2 }], totalAmount: 1, discountAmount: 99999 };
  const results = await Promise.all([1, 2].map(() => app.inject({ method: "POST", url: "/api/orders/submit", headers: headers("order-identical-key", guestToken), payload })));
  for (const result of results) assert.equal(result.statusCode, 200, result.body);
  assert.equal(results[0].json().data.orderId, results[1].json().data.orderId);
  assert.equal(results[0].json().data.finalAmount, 20000);
  assert.equal(results[0].json().data.items[0].name, "Bún Chả Hà Nội");
  orderId = results[0].json().data.orderId; itemId = results[0].json().data.items[0].id;
  assert.equal((await systemQuery(() => prisma.menuItem.findUnique({ where: { id: dishId } })))!.stockCount, 18);
});
test("invalid quantities and unscoped customer resources are rejected", async () => {
  const response = await app.inject({ method: "POST", url: "/api/orders/submit", headers: headers("invalid-quantity", guestToken), payload: { storeId: "test-A", tableId, items: [{ dishId, quantity: -1 }] } });
  assert.equal(response.statusCode, 400, response.body);
  const denied = await app.inject({ method: "GET", url: "/api/staff", headers: headers("guest-staff", guestToken) });
  assert.equal(denied.statusCode, 403, denied.body);
});
test("approval cannot cross stores and repeated approval does not duplicate items", async () => {
  const denied = await app.inject({ method: "POST", url: "/api/orders/test-B/" + orderId + "/approve", headers: headers("approve-wrong") });
  assert.equal(denied.statusCode, 403, denied.body);
  for (const key of ["approve-1", "approve-2"]) {
    const response = await app.inject({ method: "POST", url: "/api/orders/test-A/" + orderId + "/approve", headers: headers(key) }); assert.equal(response.statusCode, 200, response.body);
  }
  assert.equal(await systemQuery(() => prisma.orderItem.count({ where: { orderBatchId: orderId } })), 1);
});
test("unpaid tables cannot be closed", async () => {
  const response = await app.inject({ method: "POST", url: "/api/tables/test-A/session/close", headers: headers("unpaid-close"), payload: { tableId } });
  assert.equal(response.statusCode, 409, response.body);
});
test("payment persists once and revokes the customer session", async () => {
  const quote = await app.inject({ method: "POST", url: "/api/billing/generate-vietqr", headers: headers("quote-bill"), payload: { tableId } });
  assert.equal(quote.statusCode, 200, quote.body); assert.equal(quote.json().data.finalAmount, 20000);
  const billId = quote.json().data.id;
  const results = await Promise.all([1, 2].map(() => app.inject({ method: "POST", url: "/api/billing/checkout", headers: headers("cash-payment-once"), payload: { billId, method: "CASH", cashTendered: 20000 } })));
  for (const result of results) assert.equal(result.statusCode, 200, result.body);
  assert.equal(await systemQuery(() => prisma.payment.count({ where: { billId } })), 1);
  const expired = await app.inject({ method: "GET", url: "/api/orders/test-A/customer-snapshot", headers: headers("closed-guest", guestToken) }); assert.equal(expired.statusCode, 401, expired.body);
});

async function makeTable(label: string) {
  return systemQuery(async () => {
    const zone = (await prisma.tableZone.findFirst({ where: { storeId: "test-A" } }))!;
    return prisma.table.create({ data: { storeId: "test-A", zoneId: zone.id, name: label, code: label } });
  });
}
async function addStaffOrder(target: string, quantity = 1, chosenDish = dishId) {
  const response = await app.inject({ method: "POST", url: "/api/orders/submit", headers: headers(crypto.randomUUID()), payload: { storeId: "test-A", tableId: target, items: [{ dishId: chosenDish, quantity }] } });
  assert.equal(response.statusCode, 200, response.body); return response.json().data;
}
async function quote(target: string, extra: Record<string, unknown> = {}) {
  const response = await app.inject({ method: "POST", url: "/api/billing/generate-vietqr", headers: headers(crypto.randomUUID()), payload: { tableId: target, ...extra } });
  assert.equal(response.statusCode, 200, response.body); return response.json().data;
}
async function pay(id: string, cashTendered: number, partIndex?: number) {
  return app.inject({ method: "POST", url: "/api/billing/checkout", headers: headers(crypto.randomUUID()), payload: { billId: id, method: "CASH", cashTendered, partIndex } });
}

test("row policies isolate unfiltered runtime queries and reject foreign menu relations", async () => {
  const { databaseScope } = await import("../src/core/database/prismaClient.js");
  const role = await prisma.$queryRaw<Array<{rolbypassrls:boolean;rolsuper:boolean}>>`SELECT rolbypassrls,rolsuper FROM pg_roles WHERE rolname=current_user`;
  assert.equal(role[0].rolbypassrls, false); assert.equal(role[0].rolsuper, false);
  assert.equal(await prisma.store.count(), 0);
  assert.equal(await prisma.menuItem.count(), 0);
  const own = await databaseScope.run({storeId:"test-A",role:"STORE_OWNER",system:false}, () => prisma.store.findMany());
  assert.deepEqual(own.map(r => r.id), ["test-A"]);
  const category = await systemQuery(() => prisma.category.findFirst({where:{storeId:"test-A"}}));
  await assert.rejects(systemQuery(() => prisma.menuItem.create({data:{storeId:"test-B",categoryId:category!.id,name:"Wrong tenant",price:1}})));
});

test("idempotency keys reject changed payloads", async () => {
  const table = await makeTable("IDEMPOTENCY");
  const payload = {storeId:"test-A",tableId:table.id,items:[{dishId,quantity:1}]};
  const first = await app.inject({method:"POST",url:"/api/orders/submit",headers:headers("payload-conflict"),payload});
  assert.equal(first.statusCode,200,first.body);
  const conflict = await app.inject({method:"POST",url:"/api/orders/submit",headers:headers("payload-conflict"),payload:{...payload,items:[{dishId,quantity:2}]}});
  assert.equal(conflict.statusCode,409,conflict.body);
  assert.equal(conflict.json().code,"IDEMPOTENCY_CONFLICT");
});

test("menu keeps server IDs, customizations, zero stock, and cost", async () => {
  const response = await app.inject({method:"POST",url:"/api/menu/test-A/dishes",headers:headers("create-menu-options"),payload:{name:"Trà kiểm thử",category:"Drinks",price:12000,costPrice:4000,stockCount:0,variants:[{id:"small",name:"Nhỏ",price:12000}],customizationGroups:[{id:"sugar",name:"Đường",required:true,type:"SINGLE",options:[{id:"sugar-zero",name:"Không đường",priceModifier:0}]}]}});
  assert.equal(response.statusCode,200,response.body); const dish=response.json().data;
  assert.ok(dish.id);assert.equal(dish.costPrice,4000);assert.equal(dish.stockCount,0);assert.equal(dish.isAvailable,false);assert.equal(dish.customizationGroups[0].options[0].id,"sugar-zero");
  const table=await makeTable("OPTIONS");
  const unavailable=await app.inject({method:"POST",url:"/api/orders/submit",headers:headers("out-of-stock-item"),payload:{storeId:"test-A",tableId:table.id,items:[{dishId:dish.id,quantity:1,variantId:"small",customizationIds:["sugar-zero"]}]}});
  assert.equal(unavailable.statusCode,409,unavailable.body);
  const stock=await app.inject({method:"PATCH",url:`/api/menu/test-A/dishes/${dish.id}/stock`,headers:headers("stock-two"),payload:{stockCount:2,isAvailable:true}});assert.equal(stock.statusCode,200,stock.body);
  const missing=await app.inject({method:"POST",url:"/api/orders/submit",headers:headers("missing-required-option"),payload:{storeId:"test-A",tableId:table.id,items:[{dishId:dish.id,quantity:1,variantId:"small"}]}});assert.equal(missing.statusCode,400,missing.body);
  const valid=await app.inject({method:"POST",url:"/api/orders/submit",headers:headers("valid-required-option"),payload:{storeId:"test-A",tableId:table.id,items:[{dishId:dish.id,quantity:1,variantId:"small",customizationIds:["sugar-zero"],price:1}]}});assert.equal(valid.statusCode,200,valid.body);assert.equal(valid.json().data.finalAmount,12000);
});

test("concurrent reservations cannot oversell stock", async () => {
  const dish=await systemQuery(async()=>{const category=(await prisma.category.findFirst({where:{storeId:"test-A"}}))!;return prisma.menuItem.create({data:{storeId:"test-A",categoryId:category.id,name:"Last portion",price:100,stockCount:1}})});
  const table=await makeTable("STOCK-RACE");
  const responses=await Promise.all([1,2].map(i=>app.inject({method:"POST",url:"/api/orders/submit",headers:headers("last-portion-"+i),payload:{storeId:"test-A",tableId:table.id,items:[{dishId:dish.id,quantity:1}]}})));
  assert.deepEqual(responses.map(r=>r.statusCode).sort(),[200,409]);
  assert.equal((await systemQuery(()=>prisma.menuItem.findUnique({where:{id:dish.id}})))!.stockCount,0);
});

test("itemized payments conserve discount and keep unpaid items on the table", async () => {
  const table=await makeTable("ITEM-SPLIT");const order=await addStaffOrder(table.id,3);
  const first=await quote(table.id,{adjustment:{fixedDiscount:10001,discountReason:"Remainder test",includeVat:true,surchargeAmount:1},allocation:[{itemId:order.items[0].id,quantity:1}]});
  const paid=await pay(first.id,first.finalAmount);assert.equal(paid.statusCode,200,paid.body);assert.equal(paid.json().data.closed,false);
  const snapshot=await app.inject({method:"GET",url:"/api/orders/test-A/snapshot",headers:headers("partial-snapshot")});const remaining=snapshot.json().data.find((t:any)=>t.tableId===table.id);assert.equal(remaining.items[0].quantity,2);assert.equal(remaining.balanceAmount,21600-first.finalAmount);
  const second=await quote(table.id);assert.notEqual(first.id,second.id);
  assert.equal(first.finalAmount+second.finalAmount,21600); // (30000 - 10001 + 1) * 1.08
  const final=await pay(second.id,second.finalAmount);assert.equal(final.statusCode,200,final.body);assert.equal(final.json().data.closed,true);
});

test("equal shares preserve every dong and cash retries collect each share once", async () => {
  const table=await makeTable("EQUAL-SPLIT");await addStaffOrder(table.id);
  const bill=await quote(table.id,{adjustment:{surchargeAmount:1,discountReason:"Odd total"},splitCount:3});
  assert.deepEqual(bill.shares,[3334,3334,3333]);
  for(const index of [0,0,1,2]){const response=await pay(bill.id,bill.shares[index],index);assert.equal(response.statusCode,200,response.body);if(index===0){const snapshot=await app.inject({method:"GET",url:"/api/orders/test-A/snapshot",headers:headers("share-snapshot")});const remaining=snapshot.json().data.find((t:any)=>t.tableId===table.id);assert.equal(remaining.balanceAmount,10001-3334);assert.equal(remaining.paidAmount,3334);}}
  const payments=await systemQuery(()=>prisma.payment.findMany({where:{billId:bill.id}}));assert.equal(payments.length,3);assert.equal(payments.reduce((s,p)=>s+p.amount,0),10001);
});

test("bank callbacks verify secret, account, amount, and provider transaction uniqueness", async () => {
  await systemQuery(()=>prisma.store.update({where:{id:"test-A"},data:{bankAccount:"1234567890",bankBin:"970422",bankOwnerName:"ISOLATED TEST"}}));
  const table=await makeTable("BANK-PAY");await addStaffOrder(table.id);const bill=await quote(table.id);
  assert.ok(bill.qrUrl.includes("970422-1234567890"));
  const payload={id:100,gateway:"MBBank",accountNumber:"1234567890",transferType:"in",transferAmount:bill.finalAmount,content:bill.transferContent};
  const denied=await app.inject({method:"POST",url:"/api/billing/webhook/payment",payload});assert.equal(denied.statusCode,401,denied.body);
  const webhookHeaders={authorization:"Apikey "+process.env.PAYMENT_WEBHOOK_SECRET};
  const mismatch=await app.inject({method:"POST",url:"/api/billing/webhook/payment",headers:webhookHeaders,payload:{...payload,transferAmount:1}});assert.equal(mismatch.statusCode,409,mismatch.body);
  for(const i of [1,2]){const response=await app.inject({method:"POST",url:"/api/billing/webhook/payment",headers:webhookHeaders,payload});assert.equal(response.statusCode,200,response.body);}
  assert.equal(await systemQuery(()=>prisma.payment.count({where:{transactionRef:"sepay:100"}})),1);
  const duplicateOtherId=await app.inject({method:"POST",url:"/api/billing/webhook/payment",headers:webhookHeaders,payload:{...payload,id:101}});assert.equal(duplicateOtherId.statusCode,409,duplicateOtherId.body);
});

test("workspace versions reject stale writes and receipts update inventory atomically", async () => {
  const put=async(key:string,value:unknown,version:number)=>app.inject({method:"PUT",url:"/api/workspace/test-A/"+key,headers:headers(crypto.randomUUID()),payload:{value,version}});
  const first=await put("inventory_ingredients",[{id:"rice",name:"Rice",unit:"kg",currentStock:2,avgCostPrice:10000,updatedAt:""}],0);assert.equal(first.statusCode,200,first.body);
  const conflict=await put("inventory_ingredients",[],0);assert.equal(conflict.statusCode,409,conflict.body);
  const receipt=await app.inject({method:"POST",url:"/api/workforce/inventory-receipt",headers:headers("receipt-once"),payload:{supplierName:"Test supplier",items:[{ingredientId:"rice",quantity:2,unitPrice:20000}]}});assert.equal(receipt.statusCode,200,receipt.body);assert.equal(receipt.json().data.totalAmount,40000);
  const invalid=await app.inject({method:"POST",url:"/api/workforce/inventory-receipt",headers:headers("receipt-invalid"),payload:{supplierName:"Test supplier",items:[{ingredientId:"rice",quantity:1,unitPrice:20000},{ingredientId:"missing",quantity:1,unitPrice:100}]}});assert.equal(invalid.statusCode,404,invalid.body);
  const stock=await app.inject({method:"GET",url:"/api/workspace/test-A/inventory_ingredients",headers:headers("inventory-get")});assert.equal(stock.json().data.value[0].currentStock,4);assert.equal(stock.json().data.value[0].avgCostPrice,15000);
});

test("attendance uses server time and intercom persists actual message content",async()=>{
  for(const key of ["clock-in-one","clock-in-two"]){const response=await app.inject({method:"POST",url:"/api/workforce/attendance",headers:headers(key),payload:{action:"IN"}});assert.equal(response.statusCode,200,response.body);}
  const logs=await app.inject({method:"GET",url:"/api/workforce/attendance",headers:headers("attendance-get")});assert.equal(logs.json().data.length,1);assert.ok(Date.now()-Date.parse(logs.json().data[0].clockInTime)<30000);
  const message=await app.inject({method:"POST",url:"/api/workforce/intercom",headers:headers("chat-one"),payload:{type:"TEXT",content:"Isolated test only",targetRole:"KITCHEN",senderName:"Spoofed"}});assert.equal(message.statusCode,200,message.body);
  const messages=await app.inject({method:"GET",url:"/api/workforce/intercom",headers:headers("chat-read")});assert.equal(messages.statusCode,200,messages.body);assert.equal(messages.json().data[0].content,"Isolated test only");assert.equal(messages.json().data[0].senderName,"Owner");
});

test("replayed bank callback on a partially paid bill cannot settle the remainder", async()=>{
  await systemQuery(()=>prisma.store.update({where:{id:"test-A"},data:{bankAccount:"1234567890",bankBin:"970422",bankOwnerName:"ISOLATED TEST"}}));
  const table=await makeTable("BANK-PART");await addStaffOrder(table.id);const bill=await quote(table.id,{splitCount:3});
  const payload={id:200,gateway:"MBBank",accountNumber:"1234567890",transferType:"in",transferAmount:bill.shares[0],content:bill.transferContent+"P0"};
  for(const repeat of [1,2]){const response=await app.inject({method:"POST",url:"/api/billing/webhook/payment",headers:{authorization:"Apikey "+process.env.PAYMENT_WEBHOOK_SECRET},payload});assert.equal(response.statusCode,200,response.body);}
  const actual=await systemQuery(()=>prisma.bill.findUnique({where:{id:bill.id},include:{payments:true}}));assert.equal(actual!.paymentStatus,"PENDING");assert.equal(actual!.payments.length,1);assert.equal(actual!.payments[0].amount,bill.shares[0]);
});

test("browser preflights permit authenticated mutation methods",async()=>{
 for(const method of ["PUT","PATCH","DELETE"]){const response=await app.inject({method:"OPTIONS",url:"/api/orders/items/test/status",headers:{origin:"http://localhost:3000","access-control-request-method":method,"access-control-request-headers":"authorization,content-type,x-idempotency-key,x-client-id"}});assert.equal(response.statusCode,204,response.body);assert.ok(String(response.headers["access-control-allow-methods"]).includes(method));}
});

test("voucher quota is atomic, billed on the server, and released on cancellation", async()=>{
 const promotion={id:"promo-limit",code:"ONLYONE",title:"Isolated test",description:"Test only",discountType:"PERCENTAGE",discountValue:25,minOrderAmount:10000,maxDiscountAmount:2000,startDate:"2020-01-01",endDate:"2099-12-31",usageLimit:1,usedCount:999,isActive:true};
 const saved=await app.inject({method:"PUT",url:"/api/workspace/test-A/promotions_list",headers:headers("promo-save"),payload:{version:0,value:[promotion]}});assert.equal(saved.statusCode,200,saved.body);assert.equal(saved.json().data.value[0].usedCount,0);
 const tables=await Promise.all([makeTable("COUPON-A"),makeTable("COUPON-B")]);
 const responses=await Promise.all(tables.map((table,index)=>app.inject({method:"POST",url:"/api/orders/submit",headers:headers("coupon-race-"+index),payload:{storeId:"test-A",tableId:table.id,items:[{dishId,quantity:1}],voucherCode:"ONLYONE",discountAmount:99999}})));
 assert.deepEqual(responses.map(r=>r.statusCode).sort(),[200,400]);
 const winner=responses.findIndex(r=>r.statusCode===200),order=responses[winner].json().data;assert.equal(order.finalAmount,8000);
 const bill=await quote(tables[winner].id);assert.equal(bill.discountAmount,2000);assert.equal(bill.finalAmount,8000);
 const canceled=await app.inject({method:"POST",url:`/api/billing/bills/${bill.id}/cancel`,headers:headers("cancel-voucher-quote"),payload:{}});assert.equal(canceled.statusCode,200,canceled.body);
 const cancel=await app.inject({method:"POST",url:"/api/orders/test-A/cancel-item",headers:headers("cancel-voucher-item"),payload:{itemId:order.items[0].id}});assert.equal(cancel.statusCode,200,cancel.body);
 const doc=await systemQuery(()=>prisma.workspaceDocument.findUnique({where:{storeId_key:{storeId:"test-A",key:"promotions_list"}}}));assert.equal((doc!.data as any)[0].usedCount,0);
});

test("paid unfinished kitchen tickets persist and cannot change a new guest table",async()=>{
 const table=await makeTable("PAID-KDS");const order=await addStaffOrder(table.id);const bill=await quote(table.id);assert.equal((await pay(bill.id,bill.finalAmount)).statusCode,200);
 const open=await app.inject({method:"POST",url:"/api/tables/test-A/session/approve",headers:headers("new-guest-after-paid"),payload:{tableId:table.id}});assert.equal(open.statusCode,200,open.body);
 const tickets=await app.inject({method:"GET",url:"/api/orders/kds/tickets",headers:headers("paid-kds-get")});assert.ok(tickets.json().data.some((t:any)=>t.items.some((i:any)=>i.id===order.items[0].id)));
 for(const status of ["COOKING","DONE","SERVED"]){const response=await app.inject({method:"PATCH",url:`/api/orders/items/${order.items[0].id}/status`,headers:headers("paid-kds-"+status),payload:{status}});assert.equal(response.statusCode,200,response.body);}
 const actual=await systemQuery(()=>prisma.table.findUnique({where:{id:table.id}}));assert.equal(actual!.currentSessionId,open.json().data.sessionId);assert.equal(actual!.status,"OCCUPIED");
});

test("subscription vouchers reserve quota once and cancellation releases it",async()=>{
 await systemQuery(async()=>{
  await prisma.staff.create({data:{id:"isolated-super",storeId:"test-B",name:"Isolated Admin",role:"SUPER_ADMIN"}});
  await prisma.systemConfig.create({data:{key:"pricing_vouchers",category:"PRICING",value:JSON.stringify([{id:"saas-only",code:"SAASONCE",discountType:"FIXED_AMOUNT",discountValue:100,minContractMonths:1,validUntil:"2099-12-31",usageCount:0,maxUsage:1,isActive:true}])}});
 });
 const admin=app.jwt.sign({kind:"staff",userId:"isolated-super",storeId:"test-B",role:"SUPER_ADMIN",sessionVersion:0});
 const payload={storeId:"test-A",durationMonths:1,enabledModules:["CORE_POS"],voucherCode:"SAASONCE"};
 const attempts=await Promise.all([1,2].map(i=>app.inject({method:"POST",url:"/api/licenses/invoice/create",headers:headers("saas-quota-"+i),payload})));
 assert.deepEqual(attempts.map(r=>r.statusCode).sort(),[200,400]);const invoice=attempts.find(r=>r.statusCode===200)!.json().data;
 const cancel=await app.inject({method:"POST",url:`/api/licenses/invoice/${invoice.id}/cancel`,headers:headers("saas-cancel",admin),payload:{}});assert.equal(cancel.statusCode,200,cancel.body);
 const fresh=await app.inject({method:"POST",url:"/api/licenses/invoice/create",headers:headers("saas-after-cancel"),payload});assert.equal(fresh.statusCode,200,fresh.body);
 for(const key of ["saas-confirm-one","saas-confirm-two"]){const paid=await app.inject({method:"POST",url:`/api/licenses/invoice/${fresh.json().data.id}/confirm-payment`,headers:headers(key,admin),payload:{}});assert.equal(paid.statusCode,200,paid.body);}
 const counter=await systemQuery(()=>prisma.systemConfig.findUnique({where:{key:"pricing_vouchers"}}));assert.equal(JSON.parse(counter!.value)[0].usageCount,1);
});

test("publishing persists versions and public pages omit private store data",async()=>{
 await systemQuery(async()=>{const license=(await prisma.storeLicense.findUnique({where:{storeId:"test-A"}}))!;await prisma.storeLicense.update({where:{id:license.id},data:{enabledModules:license.enabledModules+",MODULE_LANDING_PAGE"}});});
 const save=await app.inject({method:"PUT",url:"/api/landing/cms/test-A/update",headers:headers("landing-save"),payload:{slug:"isolated-test-page",heroTitle:"Isolated test",isPublished:true}});assert.equal(save.statusCode,200,save.body);
 const page=await app.inject({method:"GET",url:"/api/landing/public/isolated-test-page"});assert.equal(page.statusCode,200,page.body);assert.equal(page.json().storeId,"test-A");assert.equal(page.json().staff,undefined);assert.equal(page.json().bankAccount,undefined);
 const publish=await app.inject({method:"POST",url:"/api/stores/test-A/publish",headers:headers("publish-actual"),payload:{}});assert.equal(publish.statusCode,200,publish.body);
 const config=await app.inject({method:"GET",url:"/api/stores/test-A/published-config",headers:headers("config-read")});assert.equal(config.json().configVersion,publish.json().configVersion);
 const cached=await app.inject({method:"GET",url:"/api/stores/test-A/published-config",headers:{...headers("config-etag"),"if-none-match":String(config.headers.etag)}});assert.equal(cached.statusCode,304);
});

test("reservations open exactly one empty table and reject seating over an active guest",async()=>{
 const table=await makeTable("RESERVED");const reservations=[{id:"reserve-1",guestCount:2,status:"CONFIRMED"},{id:"reserve-2",guestCount:3,status:"CONFIRMED"}];
 const doc=await app.inject({method:"PUT",url:"/api/workspace/test-A/reservations_data",headers:headers("reservation-save"),payload:{version:0,value:reservations}});assert.equal(doc.statusCode,200,doc.body);
 const payload={reservationId:"reserve-1",tableId:table.id};
 for(const key of ["arrive-first","arrive-repeat"]){const arrival=await app.inject({method:"POST",url:"/api/workforce/reservation-arrive",headers:headers(key),payload});assert.equal(arrival.statusCode,200,arrival.body);}
 const occupied=await app.inject({method:"POST",url:"/api/workforce/reservation-arrive",headers:headers("arrive-conflict"),payload:{...payload,reservationId:"reserve-2"}});assert.equal(occupied.statusCode,409,occupied.body);
 assert.equal(await systemQuery(()=>prisma.orderSession.count({where:{storeId:"test-A",tableId:table.id,status:"ACTIVE"}})),1);
});

test("socket handshakes authenticate, refuse foreign rooms, and ignore forged business events",async()=>{
 const {buildApp}=await import("../src/app.js"),{io}=await import("socket.io-client"),{SocketEvents}=await import("@a2order/shared"),{emitToStore,getSocketServer}=await import("../src/core/websocket/socketServer.js");
 const socketApp=await buildApp({logger:false});const address=await socketApp.listen({host:"127.0.0.1",port:0});
 const anonymous=io(address,{transports:["websocket"],reconnection:false,timeout:3000});
 const staff=io(address,{auth:{token:ownerToken},transports:["websocket"],autoConnect:false,reconnection:false,timeout:3000});
 try {
  const denied=await new Promise<Error>(resolve=>anonymous.once("connect_error",resolve));assert.equal(denied.message,"UNAUTHORIZED");
  const connected=new Promise<void>((resolve,reject)=>{staff.once("connect",()=>resolve());staff.once("connect_error",reject);});staff.connect();await connected;
  const own=await staff.timeout(5000).emitWithAck(SocketEvents.JOIN_STORE,"test-A");assert.equal(own.success,true);
  const foreign=await staff.timeout(5000).emitWithAck(SocketEvents.JOIN_STORE,"test-B");assert.equal(foreign.success,false);
  assert.equal(getSocketServer().sockets.sockets.get(staff.id!)!.rooms.has("store:test-B"),false);
  let forged=false;staff.on(SocketEvents.ORDER_APPROVED,()=>{forged=true;});staff.emit(SocketEvents.ORDER_APPROVED,{storeId:"test-A",orderId:"forged"});emitToStore("test-B",SocketEvents.ORDER_APPROVED,{storeId:"test-B"});
  await new Promise(resolve=>setTimeout(resolve,350));assert.equal(forged,false);
  const received=new Promise<any>(resolve=>staff.once(SocketEvents.ORDER_APPROVED,resolve));emitToStore("test-A",SocketEvents.ORDER_APPROVED,{storeId:"test-A",orderId:"server-only"});assert.equal((await received).orderId,"server-only");
 }finally{anonymous.disconnect();staff.disconnect();await socketApp.close();}
});

test("expired licenses block new sales while outstanding bills remain payable",async()=>{
 const table=await makeTable("EXPIRED-SETTLEMENT");await addStaffOrder(table.id);const bill=await quote(table.id);
 const license=(await systemQuery(()=>prisma.storeLicense.findUnique({where:{storeId:"test-A"}})))!;
 await systemQuery(()=>prisma.storeLicense.update({where:{id:license.id},data:{endDate:new Date(0)}}));
 try{
  const sale=await app.inject({method:"POST",url:"/api/orders/submit",headers:headers("expired-new-sale"),payload:{storeId:"test-A",tableId:table.id,items:[{dishId,quantity:1}]}});assert.equal(sale.statusCode,402,sale.body);
  const settled=await pay(bill.id,bill.finalAmount);assert.equal(settled.statusCode,200,settled.body);
  const basic=await app.inject({method:"GET",url:"/api/analytics/test-A/reports?period=today",headers:headers("history-after-expiry")});assert.equal(basic.statusCode,200,basic.body);
  const paid=bill.finalAmount;assert.ok(basic.json().data.bills.some((b:any)=>b.id===bill.id&&b.finalAmount===paid));
 }finally{await systemQuery(()=>prisma.storeLicense.update({where:{id:license.id},data:{endDate:license.endDate}}));}
 await systemQuery(()=>prisma.storeLicense.update({where:{id:license.id},data:{enabledModules:"CORE_POS"}}));
 const premium=await app.inject({method:"GET",url:"/api/analytics/test-A/deep-reports",headers:headers("premium-without-module")});assert.equal(premium.statusCode,403,premium.body);
});

test("staff edits persist contact and shift while credential changes revoke HTTP and sockets",async()=>{
 const created=await app.inject({method:"POST",url:"/api/staff",headers:headers("staff-create-regression"),payload:{storeId:"test-A",name:"Isolated Waiter",role:"WAITER",pinCode:"2468",phone:"0900000000",shift:"MORNING"}});assert.equal(created.statusCode,200,created.body);const id=created.json().data.id;
 const login=await app.inject({method:"POST",url:"/api/auth/login-pin",payload:{storeId:"test-A",staffId:id,pinCode:"2468"}});assert.equal(login.statusCode,200,login.body);const token=login.json().token;
 const edit=await app.inject({method:"PUT",url:"/api/staff/"+id,headers:headers("staff-edit-contact"),payload:{phone:"0911111111",shift:"EVENING"}});assert.equal(edit.statusCode,200,edit.body);assert.equal(edit.json().data.phone,"0911111111");assert.equal(edit.json().data.shift,"EVENING");
 const own=await app.inject({method:"PUT",url:"/api/staff/owner-test-A",headers:headers("owner-self-lock"),payload:{isActive:false}});assert.equal(own.statusCode,409,own.body);
 const stillValid=await app.inject({method:"GET",url:"/api/auth/me",headers:headers("staff-contact-session",token)});assert.equal(stillValid.statusCode,200,stillValid.body);
 const {buildApp}=await import("../src/app.js"),{io}=await import("socket.io-client");const socketApp=await buildApp({logger:false});const address=await socketApp.listen({host:"127.0.0.1",port:0});
 const socket=io(address,{auth:{token},transports:["websocket"],autoConnect:false,reconnection:false,timeout:3000});
 try{
  const connected=new Promise<void>((resolve,reject)=>{socket.once("connect",()=>resolve());socket.once("connect_error",reject);});socket.connect();await connected;
  const disconnected=new Promise<void>(resolve=>socket.once("disconnect",()=>resolve()));
  const reset=await app.inject({method:"POST",url:`/api/staff/${id}/reset-credentials`,headers:headers("staff-reset-revoke"),payload:{pinCode:"4321"}});assert.equal(reset.statusCode,200,reset.body);await disconnected;
  const revoked=await app.inject({method:"GET",url:"/api/auth/me",headers:headers("staff-revoked",token)});assert.equal(revoked.statusCode,401,revoked.body);
  const newLogin=await app.inject({method:"POST",url:"/api/auth/login-pin",payload:{storeId:"test-A",staffId:id,pinCode:"4321"}});assert.equal(newLogin.statusCode,200,newLogin.body);
 }finally{socket.disconnect();await socketApp.close();}
});
