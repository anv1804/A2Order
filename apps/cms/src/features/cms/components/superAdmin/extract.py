import os

file_path = "/home/anv/Documents/A2Order/apps/cms/src/features/cms/components/CmsSuperAdminView.tsx"
out_dir = "/home/anv/Documents/A2Order/apps/cms/src/features/cms/components/superAdmin/"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

def get_block(start_marker, skip_count=0):
    start_idx = -1
    count = 0
    for i, line in enumerate(lines):
        if start_marker in line:
            if count == skip_count:
                start_idx = i
                break
            count += 1
            
    if start_idx == -1:
        return -1, -1, ""
    
    open_braces = 0
    end_idx = start_idx
    started = False
    
    # We are matching {activeTab === ... && (
    # This means { and ( are opened.
    # The block ends when it closes with )} 
    # But using braces counting works too.
    for i in range(start_idx, len(lines)):
        line = lines[i]
        open_braces += line.count('{') - line.count('}')
        if line.count('{') > 0:
            started = True
        if started and open_braces == 0:
            end_idx = i
            break
            
    return start_idx, end_idx, "".join(lines[start_idx:end_idx+1])

a_start, a_end, a_block = get_block('{activeTab === "audit" && (', skip_count=1)
print("Audit:", a_start, a_end)

audit_code = """import React from "react";
import { Panel, Icon } from "@/components/ui";
import { SystemAuditLogRecord } from "@/types/cms.types";

export interface AuditLogViewerProps {
  auditLogs: SystemAuditLogRecord[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  auditLogs,
}) => {
  return (
""" + "\n".join(a_block.split("\n")[1:-2]) + """
  );
};
"""
with open(os.path.join(out_dir, "AuditLogViewer.tsx"), "w", encoding="utf-8") as f:
    f.write(audit_code)

# Let's replace the components in the main file
# We will do this safely in python
main_content = "".join(lines)
new_main = main_content.replace(
    "".join(lines[809:1176+1]),
    '      {activeTab === "tenants" && (\n        <TenantManager\n          stores={stores}\n          storeSearch={storeSearch}\n          setStoreSearch={setStoreSearch}\n          storeStatusFilter={storeStatusFilter}\n          setStoreStatusFilter={setStoreStatusFilter}\n          tenantPage={tenantPage}\n          setTenantPage={setTenantPage}\n          filteredStores={filteredStores}\n          paginatedStores={paginatedStores}\n          TENANT_PAGE_SIZE={TENANT_PAGE_SIZE}\n          downloadCsv={downloadCsv}\n          onImpersonateStore={onImpersonateStore}\n          setViewingStoreDetails={setViewingStoreDetails}\n          setLicenseTargetStore={setLicenseTargetStore}\n          handleToggleStoreStatus={handleToggleStoreStatus}\n        />\n      )}\n'
)

new_main = new_main.replace(
    "".join(lines[1179:1500+1]),
    '      {activeTab === "licenses" && (\n        <LicenseManager\n          licenses={licenses}\n          licenseSearch={licenseSearch}\n          setLicenseSearch={setLicenseSearch}\n          licenseStatusFilter={licenseStatusFilter}\n          setLicenseStatusFilter={setLicenseStatusFilter}\n          licensePage={licensePage}\n          setLicensePage={setLicensePage}\n          filteredLicenses={filteredLicenses}\n          paginatedLicenses={paginatedLicenses}\n          LICENSE_PAGE_SIZE={LICENSE_PAGE_SIZE}\n          downloadCsv={downloadCsv}\n          setIsCreateLicenseModalOpen={setIsCreateLicenseModalOpen}\n          handleCopyKey={handleCopyKey}\n          handleRevokeKey={handleRevokeKey}\n        />\n      )}\n'
)

new_main = new_main.replace(
    "".join(lines[1503:1743+1]),
    '      {activeTab === "invoices" && (\n        <InvoiceManager\n          invoices={invoices}\n          invoiceSearch={invoiceSearch}\n          setInvoiceSearch={setInvoiceSearch}\n          invoiceStatusFilter={invoiceStatusFilter}\n          setInvoiceStatusFilter={setInvoiceStatusFilter}\n          invoicePage={invoicePage}\n          setInvoicePage={setInvoicePage}\n          filteredInvoices={filteredInvoices}\n          paginatedInvoices={paginatedInvoices}\n          INVOICE_PAGE_SIZE={INVOICE_PAGE_SIZE}\n          downloadCsv={downloadCsv}\n          setViewingInvoice={setViewingInvoice}\n          handleConfirmInvoice={handleConfirmInvoice}\n          confirmingInvoiceId={confirmingInvoiceId}\n        />\n      )}\n'
)

new_main = new_main.replace(
    "".join(lines[a_start:a_end+1]),
    '      {activeTab === "audit" && (\n        <AuditLogViewer auditLogs={auditLogs} />\n      )}\n'
)

# Add imports
imports = """
import { TenantManager } from "./superAdmin/TenantManager";
import { LicenseManager } from "./superAdmin/LicenseManager";
import { InvoiceManager } from "./superAdmin/InvoiceManager";
import { AuditLogViewer } from "./superAdmin/AuditLogViewer";
"""
new_main = new_main.replace('import { ScenarioTemplateSkeleton } from "@/components/ui";\n', 'import { ScenarioTemplateSkeleton } from "@/components/ui";\n' + imports)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_main)

