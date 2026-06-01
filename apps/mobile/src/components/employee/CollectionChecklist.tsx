import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CollectionChecklistProps {
  tests: string[];
  onAllChecked: (checked: boolean) => void;
}

export function CollectionChecklist({ tests, onAllChecked }: CollectionChecklistProps) {
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});

  const handleToggle = (test: string) => {
    const updated = { ...checkedMap, [test]: !checkedMap[test] };
    setCheckedMap(updated);
  };

  useEffect(() => {
    const allChecked = tests.length > 0 && tests.every((t) => checkedMap[t]);
    onAllChecked(allChecked);
  }, [checkedMap, tests, onAllChecked]);

  return (
    <View className="space-y-2">
      {tests.map((test) => {
        const isChecked = !!checkedMap[test];
        return (
          <TouchableOpacity
            className={`flex-row items-center justify-between p-3.5 rounded-xl border ${
              isChecked
                ? "bg-emerald-50/50 border-emerald-300"
                : "bg-slate-50 border-slate-100"
            }`}
            key={test}
            onPress={() => handleToggle(test)}
          >
            <Text className="text-xs font-semibold text-slate-700">{test}</Text>
            <View
              className={`h-5 w-5 rounded border items-center justify-center ${
                isChecked
                  ? "bg-emerald-800 border-emerald-800"
                  : "bg-white border-slate-350"
              }`}
            >
              {isChecked && <Text className="text-white text-[10px] font-black">✓</Text>}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
