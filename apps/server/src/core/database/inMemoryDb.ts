import bcrypt from "bcryptjs";

// ==========================================
// SEEDED DEMO DATA FOR IN-MEMORY DATABASE
// ==========================================
const demoStore = {
  id: "store-demo-central",
  name: "A2Order Restaurant & Cafe",
  slug: "a2order-central",
  phone: "0901234567",
  address: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  bankAccount: "999888666",
  bankBin: "970422",
  bankOwnerName: "A2ORDER FNB VIETNAM",
  status: "ACTIVE",
  configVersion: "v1.0.0",
  vatRate: 8,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const preHashedPin = (pin: string) => bcrypt.hashSync(pin, 10);
const preHashedPassword = (pwd: string) => bcrypt.hashSync(pwd, 10);

const demoStaffList = [
  {
    id: "staff-waiter-01",
    storeId: "store-demo-central",
    name: "Lê Hoàng Long",
    email: "waiter@a2order.vn",
    phone: "0901111222",
    shift: "FULL_TIME",
    sessionVersion: 1,
    role: "WAITER",
    pinCode: preHashedPin("100001"),
    passwordHash: null,
    isActive: true,
    createdAt: new Date(),
    store: demoStore,
  },
  {
    id: "staff-cashier-01",
    storeId: "store-demo-central",
    name: "Nguyễn Thị Mai",
    email: "cashier@a2order.vn",
    phone: "0902222333",
    shift: "FULL_TIME",
    sessionVersion: 1,
    role: "CASHIER",
    pinCode: preHashedPin("200001"),
    passwordHash: null,
    isActive: true,
    createdAt: new Date(),
    store: demoStore,
  },
  {
    id: "staff-chef-01",
    storeId: "store-demo-central",
    name: "Trần Quốc Toản",
    email: "chef@a2order.vn",
    phone: "0903333444",
    shift: "FULL_TIME",
    sessionVersion: 1,
    role: "CHEF",
    pinCode: preHashedPin("300001"),
    passwordHash: null,
    isActive: true,
    createdAt: new Date(),
    store: demoStore,
  },
  {
    id: "staff-owner-01",
    storeId: "store-demo-central",
    name: "Nguyễn Văn An",
    email: "owner@a2order.vn",
    phone: "0909999888",
    shift: "FULL_TIME",
    sessionVersion: 1,
    role: "STORE_OWNER",
    pinCode: preHashedPin("900001"),
    passwordHash: preHashedPassword("A2Order@2026"),
    isActive: true,
    createdAt: new Date(),
    store: demoStore,
  },
  {
    id: "staff-admin-01",
    storeId: "store-demo-central",
    name: "Quản Trị Viên",
    email: "admin@a2order.vn",
    phone: "0908888999",
    shift: "FULL_TIME",
    sessionVersion: 1,
    role: "SUPER_ADMIN",
    pinCode: null,
    passwordHash: preHashedPassword("A2Order@2026"),
    isActive: true,
    createdAt: new Date(),
    store: demoStore,
  },
  {
    id: "staff-admin-02",
    storeId: "store-demo-central",
    name: "Super Admin",
    email: "admin@gmail.com",
    phone: "0908888998",
    shift: "FULL_TIME",
    sessionVersion: 1,
    role: "SUPER_ADMIN",
    pinCode: null,
    passwordHash: preHashedPassword("admin"),
    isActive: true,
    createdAt: new Date(),
    store: demoStore,
  },
];

const demoCategories = [
  { id: "cat-1", storeId: "store-demo-central", name: "Khai vị & Ăn vặt", sortOrder: 1, isAvailable: true, icon: "utensils" },
  { id: "cat-2", storeId: "store-demo-central", name: "Món Chính", sortOrder: 2, isAvailable: true, icon: "soup" },
  { id: "cat-3", storeId: "store-demo-central", name: "Đồ Uống & Trà Sữa", sortOrder: 3, isAvailable: true, icon: "coffee" },
];

const demoMenuItems = [
  {
    id: "dish-1",
    storeId: "store-demo-central",
    categoryId: "cat-2",
    category: demoCategories[1],
    name: "Phở Bò Tái Lăn Đặc Biệt",
    description: "Bò tái lăn thơm nức mùi tỏi phi, nước dùng hầm xương 24h đậm đà gia truyền",
    price: 85000,
    imageUrl: "/mock/pho-bo.jpg",
    isAvailable: true,
    stockCount: 50,
    archivedAt: null,
    optionsJson: "[]",
  },
  {
    id: "dish-2",
    storeId: "store-demo-central",
    categoryId: "cat-2",
    category: demoCategories[1],
    name: "Cơm Tấm Sườn Bì Chả",
    description: "Sườn que nướng mật ong than hoa, chả trứng béo ngậy kèm mỡ hành tóp mỡ",
    price: 75000,
    imageUrl: "/mock/com-tam.jpg",
    isAvailable: true,
    stockCount: 40,
    archivedAt: null,
    optionsJson: "[]",
  },
  {
    id: "dish-3",
    storeId: "store-demo-central",
    categoryId: "cat-3",
    category: demoCategories[2],
    name: "Trà Đào Cam Sả Tươi",
    description: "Trà lài ủ lạnh kết hợp đào ngâm giòn ngọt và tinh dầu cam sả thơm lừng",
    price: 45000,
    imageUrl: "/mock/tra-dao.jpg",
    isAvailable: true,
    stockCount: 100,
    archivedAt: null,
    optionsJson: "[]",
  },
  {
    id: "dish-4",
    storeId: "store-demo-central",
    categoryId: "cat-3",
    category: demoCategories[2],
    name: "Cà Phê Muối Xứ Huế",
    description: "Cốt cà phê phin đậm đà hòa quyện lớp kem muối biển béo ngậy mặn ngọt",
    price: 39000,
    imageUrl: "/mock/ca-phe-muoi.jpg",
    isAvailable: true,
    stockCount: 100,
    archivedAt: null,
    optionsJson: "[]",
  },
];

const demoTableZones = [
  { id: "zone-1", storeId: "store-demo-central", name: "Tầng 1 (Sảnh Chính)", sortOrder: 1 },
  { id: "zone-2", storeId: "store-demo-central", name: "Tầng 2 (Ngoài Trời)", sortOrder: 2 },
  { id: "zone-3", storeId: "store-demo-central", name: "Phòng VIP", sortOrder: 3 },
];

const demoTables = [
  { id: "tbl-01", storeId: "store-demo-central", zoneId: "zone-1", name: "Bàn 01", code: "T1-01", status: "EMPTY", qrSecret: "qr-tbl-01", capacity: 4, shape: "SQUARE", zone: demoTableZones[0], orderSessions: [] },
  { id: "tbl-02", storeId: "store-demo-central", zoneId: "zone-1", name: "Bàn 02", code: "T1-02", status: "OCCUPIED", qrSecret: "qr-tbl-02", capacity: 4, shape: "SQUARE", zone: demoTableZones[0], orderSessions: [] },
  { id: "tbl-03", storeId: "store-demo-central", zoneId: "zone-1", name: "Bàn 03", code: "T1-03", status: "EMPTY", qrSecret: "qr-tbl-03", capacity: 2, shape: "ROUND", zone: demoTableZones[0], orderSessions: [] },
  { id: "tbl-04", storeId: "store-demo-central", zoneId: "zone-1", name: "Bàn 04", code: "T1-04", status: "OCCUPIED", qrSecret: "qr-tbl-04", capacity: 6, shape: "RECTANGLE", zone: demoTableZones[0], orderSessions: [] },
  { id: "tbl-05", storeId: "store-demo-central", zoneId: "zone-2", name: "Bàn 05 (VIP)", code: "T2-01", status: "EMPTY", qrSecret: "qr-tbl-05", capacity: 8, shape: "RECTANGLE", zone: demoTableZones[1], orderSessions: [] },
];

// In-Memory mutable tables
const stores = [demoStore];
const staffMembers = [...demoStaffList];
const categories = [...demoCategories];
const menuItems = [...demoMenuItems];
const tableZones = [...demoTableZones];
const tables = [...demoTables];
const auditLogs: any[] = [];
const workspaceDocuments = new Map<string, any>();

function getPopulatedStore(rawStore: any) {
  const storeStaff = staffMembers.filter(st => st.storeId === rawStore.id);
  const storeTables = tables.filter(t => t.storeId === rawStore.id);
  const storeCategories = categories.filter(c => c.storeId === rawStore.id);
  const storeMenuItems = menuItems.filter(m => m.storeId === rawStore.id);
  const storeZones = tableZones.filter(z => z.storeId === rawStore.id).map(z => ({
    ...z,
    tables: storeTables.filter(t => t.zoneId === z.id),
  }));

  return {
    ...rawStore,
    staff: storeStaff,
    license: {
      id: `lic-${rawStore.id}`,
      storeId: rawStore.id,
      licenseKey: "A2-DEMO-LICENSE-KEY",
      planType: "PRO",
      status: "ACTIVE",
      endDate: new Date(Date.now() + 365 * 86400000),
      enabledModules: "CORE_POS,MODULE_KDS,MODULE_ACCOUNTING,MODULE_QR_ORDER,MODULE_INVENTORY,MODULE_HRM",
    },
    modules: ["CORE_POS", "MODULE_KDS", "MODULE_ACCOUNTING", "MODULE_QR_ORDER", "MODULE_INVENTORY", "MODULE_HRM"],
    _count: { tables: storeTables.length },
    categories: storeCategories,
    menuItems: storeMenuItems,
    tableZones: storeZones,
  };
}

export const inMemoryPrisma = {
  store: {
    async findUnique(args: any) {
      let found: any = null;
      if (args?.where?.id) found = stores.find(s => s.id === args.where.id) || null;
      else if (args?.where?.slug) found = stores.find(s => s.slug === args.where.slug) || null;
      else found = stores[0] || null;
      return found ? getPopulatedStore(found) : null;
    },
    async findFirst(args: any) {
      let found: any = null;
      if (args?.where?.id) found = stores.find(s => s.id === args.where.id) || null;
      else found = stores[0] || null;
      return found ? getPopulatedStore(found) : null;
    },
    async findMany() {
      return stores.map(s => getPopulatedStore(s));
    },
    async update(args: any) {
      const target = stores.find(s => s.id === (args?.where?.id || args?.where?.id_storeId?.id));
      if (target && args?.data) Object.assign(target, args.data);
      return target ? getPopulatedStore(target) : getPopulatedStore(demoStore);
    },
    async count() {
      return stores.length;
    },
  },

  staff: {
    async findMany(args?: any) {
      let list = [...staffMembers];
      if (args?.where?.storeId) list = list.filter(s => s.storeId === args.where.storeId);
      if (args?.where?.isActive !== undefined) list = list.filter(s => s.isActive === args.where.isActive);
      if (args?.where?.role) {
        if (typeof args.where.role === "string") list = list.filter(s => s.role === args.where.role);
        else if (args.where.role.in) list = list.filter(s => args.where.role.in.includes(s.role));
      }
      if (args?.where?.pinCode && args.where.pinCode.not === null) {
        list = list.filter(s => s.pinCode !== null);
      }
      return list;
    },
    async findUnique(args: any) {
      if (args?.where?.email) {
        const email = args.where.email.toLowerCase().trim();
        return staffMembers.find(s => s.email?.toLowerCase().trim() === email) || null;
      }
      if (args?.where?.id) return staffMembers.find(s => s.id === args.where.id) || null;
      return null;
    },
    async findFirst(args: any) {
      if (args?.where?.id) return staffMembers.find(s => s.id === args.where.id) || null;
      return staffMembers[0] || null;
    },
    async update(args: any) {
      const target = staffMembers.find(s => s.id === (args?.where?.id || args?.where?.id_storeId?.id));
      if (target && args?.data) {
        if (args.data.sessionVersion?.increment) {
          target.sessionVersion = (target.sessionVersion || 0) + args.data.sessionVersion.increment;
        }
        Object.assign(target, args.data);
      }
      return target || staffMembers[0];
    },
    async create(args: any) {
      const newStaff = {
        id: `staff-${Date.now()}`,
        ...args.data,
        createdAt: new Date(),
        store: demoStore,
      };
      staffMembers.push(newStaff);
      return newStaff;
    },
  },

  table: {
    async findMany(args?: any) {
      let list = tables.map(t => ({
        ...t,
        orderSessions: t.orderSessions || [],
        zone: t.zone || demoTableZones.find(z => z.id === t.zoneId) || demoTableZones[0],
      }));
      if (args?.where?.storeId) {
        list = list.filter(t => t.storeId === args.where.storeId);
      }
      return list;
    },
    async findFirst(args?: any) {
      let list = tables.map(t => ({
        ...t,
        orderSessions: t.orderSessions || [],
        zone: t.zone || demoTableZones.find(z => z.id === t.zoneId) || demoTableZones[0],
      }));
      if (args?.where?.id) {
        return list.find(t => t.id === args.where.id) || null;
      }
      return list[0] || null;
    },
    async count() {
      return tables.length;
    },
  },

  tableZone: {
    async findMany() {
      return [...tableZones];
    },
    async findFirst(args?: any) {
      if (args?.where?.id) return tableZones.find(z => z.id === args.where.id) || null;
      return tableZones[0] || null;
    },
  },

  menuItem: {
    async findMany(args?: any) {
      return [...menuItems];
    },
    async findFirst(args?: any) {
      if (args?.where?.id) return menuItems.find(m => m.id === args.where.id) || null;
      return menuItems[0] || null;
    },
    async update(args: any) {
      const item = menuItems.find(m => m.id === args?.where?.id || args?.where?.id_storeId?.id);
      if (item && args?.data) Object.assign(item, args.data);
      return item;
    },
    async count() {
      return menuItems.length;
    },
  },

  category: {
    async findMany() {
      return [...categories];
    },
  },

  auditLog: {
    async findMany(args?: any) {
      return [...auditLogs];
    },
    async findFirst(args?: any) {
      return auditLogs[0] || null;
    },
    async create(args: any) {
      const log = { id: `log-${Date.now()}`, ...args.data, createdAt: new Date() };
      auditLogs.push(log);
      return log;
    },
  },

  workspaceDocument: {
    async findUnique(args: any) {
      const storeId = args?.where?.storeId_key?.storeId || args?.where?.storeId;
      const key = args?.where?.storeId_key?.key || args?.where?.key;
      const doc = workspaceDocuments.get(`${storeId}:${key}`);
      return doc || null;
    },
    async findFirst(args: any) {
      const storeId = args?.where?.storeId_key?.storeId || args?.where?.storeId;
      const key = args?.where?.storeId_key?.key || args?.where?.key;
      const doc = workspaceDocuments.get(`${storeId}:${key}`);
      return doc || null;
    },
    async update(args: any) {
      const storeId = args?.where?.storeId_key?.storeId;
      const key = args?.where?.storeId_key?.key;
      const docKey = `${storeId}:${key}`;
      const existing = workspaceDocuments.get(docKey) || { id: `doc-${Date.now()}`, storeId, key, version: 1, data: null };
      if (args?.data?.data !== undefined) existing.data = args.data.data;
      if (args?.data?.version?.increment) existing.version = (existing.version || 1) + args.data.version.increment;
      workspaceDocuments.set(docKey, existing);
      return existing;
    },
    async upsert(args: any) {
      const storeId = args?.where?.storeId_key?.storeId;
      const key = args?.where?.storeId_key?.key;
      const docKey = `${storeId}:${key}`;
      let existing = workspaceDocuments.get(docKey);
      if (existing) {
        if (args?.update?.data !== undefined) existing.data = args.update.data;
        if (args?.update?.version?.increment) existing.version = (existing.version || 1) + args.update.version.increment;
      } else {
        existing = {
          id: `doc-${Date.now()}`,
          storeId,
          key,
          version: 1,
          data: args?.create?.data || null,
        };
      }
      workspaceDocuments.set(docKey, existing);
      return existing;
    },
    async create(args: any) {
      const storeId = args?.data?.storeId;
      const key = args?.data?.key;
      const doc = {
        id: `doc-${Date.now()}`,
        storeId,
        key,
        version: 1,
        data: args?.data?.data || null,
      };
      workspaceDocuments.set(`${storeId}:${key}`, doc);
      return doc;
    },
  },

  storeLicense: {
    async findUnique(args: any) {
      const storeId = args?.where?.storeId || "store-demo-central";
      return {
        id: `lic-${storeId}`,
        storeId,
        licenseKey: "A2-DEMO-LICENSE-KEY",
        planType: "PRO",
        status: "ACTIVE",
        endDate: new Date(Date.now() + 365 * 86400000),
        enabledModules: "CORE_POS,MODULE_KDS,MODULE_ACCOUNTING,MODULE_QR_ORDER,MODULE_INVENTORY,MODULE_HRM",
      };
    },
  },

  systemConfig: {
    async findUnique() {
      return null;
    },
    async deleteMany() {
      return { count: 0 };
    },
  },

  serviceRequest: {
    async findFirst() {
      return null;
    },
    async findMany() {
      return [];
    },
    async create(args: any) {
      return { id: `sr-${Date.now()}`, ...args.data };
    },
    async update(args: any) {
      return { id: args?.where?.id, ...args.data };
    },
  },

  orderSession: {
    async findFirst() {
      return null;
    },
    async findMany() {
      return [];
    },
    async create(args: any) {
      return { id: `sess-${Date.now()}`, ...args.data };
    },
    async update(args: any) {
      return { id: args?.where?.id, ...args.data };
    },
  },

  orderBatch: {
    async findMany() {
      return [];
    },
    async findFirst() {
      return null;
    },
    async create(args: any) {
      return { id: `batch-${Date.now()}`, ...args.data };
    },
    async update(args: any) {
      return { id: args?.where?.id, ...args.data };
    },
  },

  orderItem: {
    async findMany() {
      return [];
    },
    async findFirst() {
      return null;
    },
    async update(args: any) {
      return { id: args?.where?.id, ...args.data };
    },
  },

  bill: {
    async findFirst() {
      return null;
    },
    async findMany() {
      return [];
    },
    async create(args: any) {
      return { id: `bill-${Date.now()}`, ...args.data };
    },
    async update(args: any) {
      return { id: args?.where?.id, ...args.data };
    },
  },

  async $queryRaw() {
    return [];
  },

  async $transaction(fn: any) {
    return fn(inMemoryPrisma);
  },
};

