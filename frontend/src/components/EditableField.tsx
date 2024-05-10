import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Input, Select } from "antd";
import { ReactNode, useEffect, useState } from "react";
import { ValueLabel } from "../types/option";

export interface EditingFieldProps {
  options: ValueLabel[];

  field?: string;
  value: string;

  onSave?: (field: string, value: string) => Promise<boolean>;
  onCancel?: (field?: string) => any;
  onDelete?: (field: string) => Promise<boolean>;
}

export default function EditingField({
  options,
  field,
  value,
  onSave,
  onCancel,
  onDelete,
}: EditingFieldProps) {
  const [editing, setEditing] = useState(!Boolean(value));
  const [tempField, setTempField] = useState(field);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
    if (value) setEditing(false);
  }, [value]);

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: "125px 1fr" }}>
      <div className="">
        <Select
          disabled={Boolean(field) || !editing || options.length <= 1}
          options={options}
          value={tempField}
          onChange={(selectVal) => setTempField(selectVal)}
          className="w-full"
        ></Select>
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex-grow">
          <Input
            disabled={!editing}
            value={tempValue}
            onChange={(e) => {
              setTempValue(e.target.value);
            }}
          ></Input>
        </div>

        {editing ? (
          <>
            <Button
              icon={<CheckOutlined />}
              disabled={!tempField || !tempValue}
              onClick={async () => {
                if (tempField && tempValue) {
                  if (onSave && await onSave(tempField, tempValue)) {
                    setEditing(false)
                  }
                }
              }}
              type="primary"
            ></Button>

            <Button
              icon={<CloseOutlined />}
              onClick={async () => {
                if (!field || !value) {
                  if (onCancel) onCancel()
                } else {
                  setTempField(field)
                  setTempValue(value)
                  setEditing(false)
                }
              }}
              danger
            ></Button>
          </>
        ) : (
          <>
            <Button
              icon={<EditOutlined />}
              onClick={() => setEditing(true)}
            ></Button>

            <Button
              icon={<DeleteOutlined />}
              onClick={async () => {
                if (field) {
                  if (!onDelete || (await onDelete(field))) {
                    if (onCancel) onCancel(field);
                  }
                }
              }}
              danger
            ></Button>
          </>
        )}
      </div>
    </div>
  );
}
