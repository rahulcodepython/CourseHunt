import * as TablerIcons from "@tabler/icons-react";

export interface IconProps extends TablerIcons.IconProps {
  name: keyof typeof TablerIcons;
}

export function Icon({ name, className, ...props }: IconProps) {
  const IconComponent = TablerIcons[name] as React.ElementType;

  if (!IconComponent) {
    console.warn(`Icon '${name}' not found in @tabler/icons-react`);
    return null;
  }

  return <IconComponent className={`w-5 h-5 ${className || ""}`} {...props} />;
}
