import { useCallback, useState } from "react";
import { useSDK } from "../../providers/SDKProvider";

export const ToggleBooleanCell = ({ column, original, value }) => {
  const [checked, setChecked] = useState(!!value);
  const sdk = useSDK();

  const handleToggle = useCallback(
    async (e) => {
      e.stopPropagation();
      const newValue = !checked;

      setChecked(newValue);
      try {
        await sdk.apiCall("updateTask", { taskID: original.id }, { body: { image_unreadable: newValue } });
      } catch (err) {
        console.error("Failed to update image_unreadable flag:", err);
        setChecked(checked);
      }
    },
    [checked, sdk, original],
  );

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={handleToggle}
      onClick={(e) => e.stopPropagation()}
      style={{ cursor: "pointer", width: 16, height: 16 }}
    />
  );
};

ToggleBooleanCell.userSelectable = false;
