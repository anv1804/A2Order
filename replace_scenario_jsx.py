import re

with open("apps/cms/src/features/cms/components/superAdmin/ScenarioTemplateManager.tsx", "r") as f:
    content = f.read()

# Add imports
imports = """import { ScenarioSidebar } from "./scenario/ScenarioSidebar";
import { ScenarioDishList } from "./scenario/ScenarioDishList";
"""

content = content.replace('import { AddCategoryModal } from "./modals/AddCategoryModal";', 
                          'import { AddCategoryModal } from "./modals/AddCategoryModal";\n' + imports)

# Remove the old JSX
jsx_start = content.find("  return (\n    <div className=\"space-y-5 animate-fadeIn\">")

new_jsx = """  return (
    <div className="space-y-5 animate-fadeIn pb-10">
      {/* HEADER TỐI GIẢN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-ink-primary tracking-tight">
              Quản Trị Kịch Bản & Thực Đơn Mẫu F&B
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200 font-extrabold text-[10px] whitespace-nowrap shrink-0">
              {dishes.length} món mẫu
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            Quản lý kho thực đơn mẫu, các biến thể size và nhóm tùy chọn đề xuất cho từng mô hình F&B.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <ScenarioSidebar 
          activeMajor={activeMajor}
          handleSwitchMajor={handleSwitchMajor}
          countsByMajor={countsByMajor}
          activeCategories={activeCategories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          handleOpenAddCategory={handleOpenAddCategory}
          handleDeleteCategory={handleDeleteCategory}
        />

        <div className="flex-1 w-full min-w-0 space-y-4 flex flex-col min-h-[600px]">
          <ScenarioDishList 
            activeMajor={activeMajor}
            selectedCategory={selectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
            filteredDishes={filteredDishes}
            currentPage={currentPage}
            handleEditDish={handleEditDish}
            handleDeleteDish={handleDeleteDish}
            handleOpenAddDish={() => { setEditingDish(null); setIsDishModalOpen(true); }}
          />

          {filteredDishes.length > PAGE_SIZE && (
            <div className="flex justify-end items-center bg-white rounded-2xl border border-surface-border p-3 shadow-sm">
              <Pagination
                currentPage={currentPage}
                totalItems={filteredDishes.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {isDishModalOpen && (
        <ScenarioDishModal
          isOpen={isDishModalOpen}
          onClose={() => setIsDishModalOpen(false)}
          onSave={handleSaveDish}
          initialData={editingDish}
          defaultMajor={activeMajor}
        />
      )}

      {isAddCatModalOpen && (
        <AddCategoryModal
          isOpen={isAddCatModalOpen}
          onClose={() => setIsAddCatModalOpen(false)}
          onSave={handleAddCategory}
          majorType={catModalTargetMajor}
        />
      )}
    </div>
  );
};
"""

with open("apps/cms/src/features/cms/components/superAdmin/ScenarioTemplateManager.tsx", "w") as f:
    f.write(content[:jsx_start] + new_jsx)

