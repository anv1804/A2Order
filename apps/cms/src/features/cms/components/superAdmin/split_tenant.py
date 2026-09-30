import os

file_path = "/home/anv/Documents/A2Order/apps/cms/src/features/cms/components/superAdmin/TenantManager.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

def get_block(start_marker, end_marker=None):
    start_idx = -1
    for i, line in enumerate(lines):
        if start_marker in line:
            start_idx = i
            break
    if start_idx == -1:
        return -1, -1, ""
    
    open_braces = 0
    open_tags = 0
    end_idx = start_idx
    started = False
    for i in range(start_idx, len(lines)):
        line = lines[i]
        open_braces += line.count('{') - line.count('}')
        open_tags += line.count('<div') - line.count('</div')
        if line.count('<div') > 0:
            started = True
        if started and open_braces == 0 and open_tags == 0:
            end_idx = i
            break
    return start_idx, end_idx, "".join(lines[start_idx:end_idx+1])

d_start, d_end, d_block = get_block('<div className="hidden lg:block overflow-x-auto">')
print("Desktop:", d_start, d_end)

m_start, m_end, m_block = get_block('<div className="block lg:hidden">')
print("Mobile:", m_start, m_end)

desktop_code = """import React from "react";
import { Icon } from "@/components/ui";
import { TenantStoreRecord, BUSINESS_TYPE_CONFIG } from "@/types/cms.types";

export interface TenantDesktopTableProps {
  paginatedStores: TenantStoreRecord[];
  onImpersonateStore?: (store: TenantStoreRecord) => void;
  setViewingStoreDetails: (store: TenantStoreRecord) => void;
  setLicenseTargetStore: (store: TenantStoreRecord) => void;
  handleToggleStoreStatus: (store: TenantStoreRecord) => void;
}

export const TenantDesktopTable: React.FC<TenantDesktopTableProps> = ({
  paginatedStores,
  onImpersonateStore,
  setViewingStoreDetails,
  setLicenseTargetStore,
  handleToggleStoreStatus,
}) => {
  return (
""" + "    " + "\n".join(d_block.split("\n")) + """
  );
};
"""

with open(os.path.join(os.path.dirname(file_path), "TenantDesktopTable.tsx"), "w", encoding="utf-8") as f:
    f.write(desktop_code)

mobile_code = """import React from "react";
import { Icon } from "@/components/ui";
import { TenantStoreRecord, BUSINESS_TYPE_CONFIG } from "@/types/cms.types";

export interface TenantMobileCardsProps {
  paginatedStores: TenantStoreRecord[];
  onImpersonateStore?: (store: TenantStoreRecord) => void;
  setViewingStoreDetails: (store: TenantStoreRecord) => void;
  setLicenseTargetStore: (store: TenantStoreRecord) => void;
  handleToggleStoreStatus: (store: TenantStoreRecord) => void;
}

export const TenantMobileCards: React.FC<TenantMobileCardsProps> = ({
  paginatedStores,
  onImpersonateStore,
  setViewingStoreDetails,
  setLicenseTargetStore,
  handleToggleStoreStatus,
}) => {
  return (
""" + "    " + "\n".join(m_block.split("\n")) + """
  );
};
"""

with open(os.path.join(os.path.dirname(file_path), "TenantMobileCards.tsx"), "w", encoding="utf-8") as f:
    f.write(mobile_code)

# Replace in original file
new_lines = lines[:d_start] + [
    '            <TenantDesktopTable\n',
    '              paginatedStores={paginatedStores}\n',
    '              onImpersonateStore={onImpersonateStore}\n',
    '              setViewingStoreDetails={setViewingStoreDetails}\n',
    '              setLicenseTargetStore={setLicenseTargetStore}\n',
    '              handleToggleStoreStatus={handleToggleStoreStatus}\n',
    '            />\n'
] + lines[d_end+1:m_start] + [
    '            <TenantMobileCards\n',
    '              paginatedStores={paginatedStores}\n',
    '              onImpersonateStore={onImpersonateStore}\n',
    '              setViewingStoreDetails={setViewingStoreDetails}\n',
    '              setLicenseTargetStore={setLicenseTargetStore}\n',
    '              handleToggleStoreStatus={handleToggleStoreStatus}\n',
    '            />\n'
] + lines[m_end+1:]

imports = """
import { TenantDesktopTable } from "./TenantDesktopTable";
import { TenantMobileCards } from "./TenantMobileCards";
"""
final_code = imports + "".join(new_lines)
with open(file_path, "w", encoding="utf-8") as f:
    f.write(final_code)

