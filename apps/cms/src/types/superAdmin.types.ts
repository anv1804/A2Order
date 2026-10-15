import React from "react";
import {
  AppModule,
  BusinessType,
  StoreScale,
  FnbMajorCategory,
  FnbCategoryTemplate,
  FnbDishItem,
} from "@a2order/shared";
import {
  TenantStoreRecord,
  SoftwareInvoiceRecord,
  SystemAuditLogRecord,
  PlatformStoreUserRecord,
} from "./cms.types.js";

export interface LicenseKeyRecord {
  id: string;
  keyCode: string;
  storeName?: string;
  storeId?: string;
  plan: "STARTER" | "GROWTH" | "PRO" | "ENTERPRISE";
  maxDevices: number;
  durationMonths: number;
  issuedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "REVOKED" | "UNASSIGNED";
  modules: AppModule[];
}

export interface StoreOnboardSubmitData {
  name: string;
  owner: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerPin: string;
  phone: string;
  address: string;
  businessType: BusinessType;
  scale: StoreScale;
  modules: AppModule[];
  tableCount: number;
  durationMonths: number;
  plan: "STARTER" | "GROWTH" | "PRO";
}

export interface StoreOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (storeData: StoreOnboardSubmitData) => Promise<TenantStoreRecord | null>;
}

export interface StoreUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<PlatformStoreUserRecord>, password?: string) => Promise<void>;
  editingUser: PlatformStoreUserRecord | null;
  stores: TenantStoreRecord[];
  defaultStoreId?: string;
}

export interface StoreDossierModalProps {
  store: TenantStoreRecord | null;
  invoices: SoftwareInvoiceRecord[];
  stores?: TenantStoreRecord[];
  onClose: () => void;
  onCopyKey: (key: string) => void;
  onOpenRenewModal: (store: TenantStoreRecord) => void;
  onToggleModule: (storeId: string, moduleId: AppModule) => void;
  onToggleStoreStatus: (store: TenantStoreRecord) => void;
  onDeleteStore?: (store: TenantStoreRecord) => void;
  onViewInvoice?: (inv: SoftwareInvoiceRecord) => void;
  onUpdateStore?: (updatedStore: TenantStoreRecord) => void;
}

export interface SuspendStoreModalProps {
  store: TenantStoreRecord | null;
  mode: "SUSPEND" | "ACTIVATE";
  onClose: () => void;
  onConfirm: (store: TenantStoreRecord) => void;
}

export interface CreateLicenseKeyModalProps {
  isOpen: boolean;
  stores: Array<{ id: string; name: string; owner: string; phone: string; licenseKey?: string }>;
  onClose: () => void;
  onSubmit: (licenseData: {
    storeId?: string;
    storeName?: string;
    plan: "STARTER" | "GROWTH" | "PRO";
    durationMonths: number;
    maxDevices: number;
  }) => void;
}

export interface AddCategoryModalProps {
  isOpen: boolean;
  initialMajorType?: FnbMajorCategory;
  onClose: () => void;
  onSave: (category: Omit<FnbCategoryTemplate, "id">) => void;
}

export interface InvoiceModalProps {
  invoice: SoftwareInvoiceRecord | null;
  onClose: () => void;
  onConfirmPayment: (invoice: SoftwareInvoiceRecord) => void;
}

export interface ResetUserCredentialsModalProps {
  user: PlatformStoreUserRecord | null;
  onClose: () => void;
  onReset: (userId: string, payload: { password?: string; pinCode?: string }) => Promise<void>;
}

export interface ScenarioDishModalProps {
  isOpen: boolean;
  majorType: FnbMajorCategory;
  categories: FnbCategoryTemplate[];
  initialDish?: FnbDishItem | null;
  onClose: () => void;
  onSave: (dishData: Omit<FnbDishItem, "id">, dishId?: string) => Promise<void>;
}

export interface LicenseModalProps {
  store: {
    id: string;
    name: string;
    licenseKey?: string;
    plan?: string;
  } | null;
  onClose: () => void;
  onSave: (payload: {
    storeId: string;
    plan: "STARTER" | "GROWTH" | "PRO";
    durationMonths: number;
    finalAmount: number;
  }) => void;
}

export interface DeleteStoreModalProps {
  store: TenantStoreRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (store: TenantStoreRecord) => Promise<void> | void;
}

export interface AuditDetailModalProps {
  log: SystemAuditLogRecord | null;
  onClose: () => void;
}

export interface TenantManagerProps {
  stores: TenantStoreRecord[];
  storeSearch: string;
  setStoreSearch: (val: string) => void;
  storeStatusFilter: string;
  setStoreStatusFilter: (val: string) => void;
  storePlanFilter: string;
  setStorePlanFilter: (val: string) => void;
  storeProvinceFilter: string;
  setStoreProvinceFilter: (val: string) => void;
  tenantPage: number;
  setTenantPage: (page: number) => void;
  filteredStores: TenantStoreRecord[];
  paginatedStores: TenantStoreRecord[];
  TENANT_PAGE_SIZE: number;
  downloadCsv: (filename: string, headers: string[], rows: unknown[][]) => void;
  setViewingStoreDetails: (store: TenantStoreRecord) => void;
  setLicenseTargetStore: (store: TenantStoreRecord) => void;
  setIsOnboardingModalOpen?: (val: boolean) => void;
  handleToggleStoreStatus: (store: TenantStoreRecord) => void;
  onOpenNewStoreModal: () => void;
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export interface TenantDesktopTableProps {
  paginatedStores: TenantStoreRecord[];
  selectedStoreIds: string[];
  onToggleSelectStore: (storeId: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  setViewingStoreDetails: (store: TenantStoreRecord) => void;
  setLicenseTargetStore: (store: TenantStoreRecord) => void;
  handleToggleStoreStatus: (store: TenantStoreRecord) => void;
}

export interface TenantMobileCardsProps {
  paginatedStores: TenantStoreRecord[];
  selectedStoreIds: string[];
  onToggleSelectStore: (storeId: string) => void;
  setViewingStoreDetails: (store: TenantStoreRecord) => void;
  setLicenseTargetStore: (store: TenantStoreRecord) => void;
  handleToggleStoreStatus: (store: TenantStoreRecord) => void;
}

export interface LicenseManagerProps {
  licenses: LicenseKeyRecord[];
  licenseSearch: string;
  setLicenseSearch: (val: string) => void;
  licenseStatusFilter: string;
  setLicenseStatusFilter: (val: string) => void;
  licensePage: number;
  setLicensePage: (page: number) => void;
  filteredLicenses: LicenseKeyRecord[];
  paginatedLicenses: LicenseKeyRecord[];
  LICENSE_PAGE_SIZE: number;
  downloadCsv: (filename: string, headers: string[], rows: unknown[][]) => void;
  setIsCreateLicenseModalOpen: (val: boolean) => void;
  handleCopyKey: (key: string) => void;
  handleRevokeKey: (lic: LicenseKeyRecord) => void;
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export interface LicenseDesktopTableProps {
  paginatedLicenses: LicenseKeyRecord[];
  selectedLicenseIds: string[];
  onToggleSelectLicense: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  handleCopyKey: (key: string) => void;
  handleRevokeKey: (lic: LicenseKeyRecord) => void;
}

export interface LicenseMobileCardsProps {
  paginatedLicenses: LicenseKeyRecord[];
  selectedLicenseIds: string[];
  onToggleSelectLicense: (id: string) => void;
  handleCopyKey: (key: string) => void;
  handleRevokeKey: (lic: LicenseKeyRecord) => void;
}

export interface StoreUserManagerProps {
  stores: TenantStoreRecord[];
  downloadCsv: (filename: string, headers: string[], rows: unknown[][]) => void;
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export interface StoreUserDesktopTableProps {
  paginatedUsers: PlatformStoreUserRecord[];
  selectedUserIds: string[];
  onToggleSelectUser: (userId: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onEditUser: (user: PlatformStoreUserRecord) => void;
  onResetCredentials: (user: PlatformStoreUserRecord) => void;
  onToggleUserStatus: (user: PlatformStoreUserRecord) => void;
}

export interface StoreUserMobileCardsProps {
  paginatedUsers: PlatformStoreUserRecord[];
  selectedUserIds: string[];
  onToggleSelectUser: (userId: string) => void;
  onEditUser: (user: PlatformStoreUserRecord) => void;
  onResetCredentials: (user: PlatformStoreUserRecord) => void;
  onToggleUserStatus: (user: PlatformStoreUserRecord) => void;
}

export interface InvoiceManagerProps {
  invoices: SoftwareInvoiceRecord[];
  invoiceSearch: string;
  setInvoiceSearch: (val: string) => void;
  invoiceStatusFilter: string;
  setInvoiceStatusFilter: (val: string) => void;
  invoicePage: number;
  setInvoicePage: (page: number) => void;
  filteredInvoices: SoftwareInvoiceRecord[];
  paginatedInvoices: SoftwareInvoiceRecord[];
  INVOICE_PAGE_SIZE: number;
  downloadCsv: (filename: string, headers: string[], rows: unknown[][]) => void;
  setViewingInvoice: (inv: SoftwareInvoiceRecord) => void;
  handleConfirmInvoice: (inv: SoftwareInvoiceRecord) => void;
  confirmingInvoiceId: string | null;
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export interface InvoiceDesktopTableProps {
  paginatedInvoices: SoftwareInvoiceRecord[];
  selectedInvoiceIds: string[];
  onToggleSelectInvoice: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  setViewingInvoice: (inv: SoftwareInvoiceRecord) => void;
  handleConfirmInvoice: (inv: SoftwareInvoiceRecord) => void;
  confirmingInvoiceId: string | null;
}

export interface InvoiceMobileCardsProps {
  paginatedInvoices: SoftwareInvoiceRecord[];
  selectedInvoiceIds: string[];
  onToggleSelectInvoice: (id: string) => void;
  setViewingInvoice: (inv: SoftwareInvoiceRecord) => void;
  handleConfirmInvoice: (inv: SoftwareInvoiceRecord) => void;
  confirmingInvoiceId: string | null;
}

export interface AuditLogViewerProps {
  auditLogs: SystemAuditLogRecord[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  downloadCsv?: (filename: string, headers: string[], rows: unknown[][]) => void;
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export interface AuditDesktopTableProps {
  paginatedLogs: SystemAuditLogRecord[];
  onViewDetails: (log: SystemAuditLogRecord) => void;
}

export interface AuditMobileCardsProps {
  paginatedLogs: SystemAuditLogRecord[];
  onViewDetails: (log: SystemAuditLogRecord) => void;
}

export interface ScenarioTemplateManagerProps {
  isMaximized?: boolean;
  setIsMaximized?: (val: boolean | ((prev: boolean) => boolean)) => void;
  downloadCsv?: (filename: string, headers: string[], rows: unknown[][]) => void;
}

export interface ScenarioDesktopTableProps {
  paginatedDishes: FnbDishItem[];
  selectedDishIds: string[];
  onToggleSelectDish: (id: string) => void;
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  handleEditDish: (dish: FnbDishItem) => void;
  handleDeleteDish: (dish: FnbDishItem) => void;
}

export interface ScenarioMobileCardsProps {
  dishes: FnbDishItem[];
  selectedDishIds: string[];
  onToggleSelectDish: (id: string) => void;
  handleEditDish: (dish: FnbDishItem) => void;
  handleDeleteDish: (dish: FnbDishItem) => void;
  sentinelRef: React.RefObject<HTMLDivElement | null> | React.MutableRefObject<HTMLDivElement | null>;
  hasMore: boolean;
  totalCount: number;
  visibleCount: number;
}

export interface SaasDashboardProps {
  stores: TenantStoreRecord[];
  invoices: SoftwareInvoiceRecord[];
  licenses: LicenseKeyRecord[];
  auditLogs: SystemAuditLogRecord[];
  connectedSources: string[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenNewStoreModal: () => void;
  onSwitchTab: (tab: any) => void;
  onViewStoreDetails: (store: TenantStoreRecord) => void;
}
