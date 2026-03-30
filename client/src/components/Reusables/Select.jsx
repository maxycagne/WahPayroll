// src/components/Reusables/Select.jsx
import {
  Select as UiSelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "../ui/select";

export default function Select({
  value,
  setValue,
  toMap,
  placeholder = "Select an option",
}) {
  return (
    <UiSelect value={value} onValueChange={setValue}>
      <SelectTrigger className="w-full ">
        <SelectValue
          placeholder={placeholder}
          className="text-gray-400 italic"
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Options</SelectLabel>
          {toMap.map((item, index) => (
            <SelectItem value={item} key={index}>
              {item}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </UiSelect>
  );
}
