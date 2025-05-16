import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}

export const MultiSelect = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  MultiSelectProps
>(({ values, onValuesChange, placeholder = "Selecione os itens", children, className, ...props }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (value: string) => {
    const newValues = values.filter((v) => v !== value);
    onValuesChange(newValues);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && values.length > 0) {
          const newValues = [...values];
          newValues.pop();
          onValuesChange(newValues);
        }
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
    >
      <div className="flex flex-wrap gap-1">
        {values.map((value) => {
          return (
            <Badge
              key={value}
              variant="secondary"
              className="mr-1 mb-1"
            >
              {React.Children.toArray(children).find((child) => {
                return (
                  React.isValidElement(child) &&
                  child.props.value === value
                );
              })?.props.text || value}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnselect(value);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(value)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          );
        })}
        <CommandPrimitive
          ref={ref}
          className="flex-1"
          open={open}
          onOpenChange={setOpen}
          onKeyDown={handleKeyDown}
          {...props}
        >
          <div className="flex items-center">
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground ml-1 h-8 flex-1"
              placeholder={values.length > 0 ? "" : placeholder}
            />
          </div>
        </CommandPrimitive>
      </div>
      <div className="relative">
        {open && (
          <div className="absolute top-0 left-0 z-10 w-full mt-2 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <Command className="w-full">
              <CommandGroup className="max-h-60 overflow-auto">
                {React.Children.map(children, (child) => {
                  if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                      onSelect: (value: string) => {
                        setInputValue("");
                        if (!values.includes(value)) {
                          onValuesChange([...values, value]);
                        }
                      },
                      className: cn(
                        child.props.className,
                        "cursor-pointer",
                        values.includes(child.props.value)
                          ? "opacity-50 pointer-events-none"
                          : ""
                      ),
                    });
                  }
                  return child;
                })}
              </CommandGroup>
            </Command>
          </div>
        )}
      </div>
    </div>
  );
});

MultiSelect.displayName = "MultiSelect";

interface MultiSelectItemProps {
  value: string;
  text: string;
  className?: string;
  onSelect?: (value: string) => void;
}

export const MultiSelectItem = React.forwardRef<
  React.ElementRef<typeof CommandItem>,
  MultiSelectItemProps
>(({ value, text, className, ...props }, ref) => {
  return (
    <CommandItem
      ref={ref}
      value={value}
      onSelect={(currentValue) => {
        props.onSelect?.(currentValue);
      }}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {text}
    </CommandItem>
  );
});

MultiSelectItem.displayName = "MultiSelectItem";