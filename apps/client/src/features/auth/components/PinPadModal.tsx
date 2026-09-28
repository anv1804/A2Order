import React, { useState } from "react";
import { NumericKeypad } from "@/components/shared/NumericKeypad";
import { UserCheck } from "lucide-react";
import { StaffMember, PinPadModalProps } from "@/types";

export const PinPadModal: React.FC<PinPadModalProps> = ({
  isOpen,
  staffList,
  onPinSubmit,
}) => {
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [pin, setPin] = useState<string>("");

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4 && selectedStaff) {
        onPinSubmit(selectedStaff.id, nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col justify-between p-6 select-none">
      <div className="text-center pt-4">
        <img
          src="/logo-symbol.jpg"
          alt="A2Order"
          className="w-14 h-14 rounded-2xl mx-auto mb-3 shadow-xl object-cover ring-2 ring-emerald-500/20"
        />
        <h2 className="text-2xl font-black text-white">A2Order Fast-PIN</h2>
        <p className="text-xs text-slate-400 mt-1">Đăng nhập vào ca làm việc trong 1 giây</p>
      </div>

      {!selectedStaff ? (
        <div className="max-w-md w-full mx-auto my-auto space-y-3">
          <p className="text-sm font-semibold text-slate-400 text-center mb-4">
            CHỌN TÊN BẠN ĐỂ BẮT ĐẦU:
          </p>
          <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto p-1">
            {staffList.map((staff) => (
              <button
                key={staff.id}
                onClick={() => setSelectedStaff(staff)}
                className="p-4 rounded-2xl bg-slate-800 border border-slate-700 active:scale-95 transition-all text-left flex items-center gap-3 text-white hover:border-blue-500"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm truncate">{staff.name}</h4>
                  <span className="text-[11px] text-slate-400">{staff.role}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-xs w-full mx-auto my-auto flex flex-col items-center">
          <button
            onClick={() => {
              setSelectedStaff(null);
              setPin("");
            }}
            className="text-xs text-blue-400 font-semibold mb-3 hover:underline"
          >
            ← Chọn nhân viên khác
          </button>

          <h3 className="text-lg font-bold text-white mb-1">{selectedStaff.name}</h3>
          <p className="text-xs text-slate-400 mb-6">Nhập mã PIN 4 số của bạn</p>

          <div className="flex gap-4 mb-8">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  index < pin.length
                    ? "bg-blue-500 border-blue-500 scale-110"
                    : "border-slate-600 bg-transparent"
                }`}
              />
            ))}
          </div>

          <NumericKeypad
            onDigitPress={handleDigit}
            onDeletePress={handleDelete}
            onClearPress={handleClear}
          />
        </div>
      )}

      <div className="text-center pb-2 text-[11px] text-slate-500">
        A2Order Operating System • Bảo mật mã PIN độc lập
      </div>
    </div>
  );
};
