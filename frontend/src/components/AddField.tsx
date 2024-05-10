import { useState } from "react";
import { Button } from "antd";
import { ValueLabel } from "../types/option";
import { PlusOutlined } from "@ant-design/icons";
import EditableField from "./EditableField";

export interface AddFieldProps {
  options: ValueLabel[];
  onSave?: (field: string, value: string) => Promise<boolean>;
  onCancel?: (field?: string) => Promise<boolean>;
}

export default function AddField({
  options,
  onSave,
  onCancel,
}: AddFieldProps) {
  const [ adding, setAdding ] = useState(false)

  const cancelWrapper = async () => {
    if (onCancel && await onCancel()) {
      setAdding(false)
      return true
    }

    return false
  }

  if (adding) {
    return (
      <EditableField
        options={options}
        onSave={onSave}
        onCancel={cancelWrapper}
        onDelete={cancelWrapper}
        value=""
      ></EditableField>
    )
  } else {
    return (
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setAdding(true)}>Add</Button>
    )
  }
}