import * as TablerIcons from "@tabler/icons-react";

export interface IconProps extends TablerIcons.IconProps {
  /**
   * The name of the Tabler Icon to render.
   * Example: 'IconStar', 'IconUser', etc.
   */
  name: keyof typeof TablerIcons;
}

/**
 * A generic icon component that standardizes icon sizes across the application.
 * Defaults to w-5 h-5 (20px) which is more visible than the default 16px.
 */
export function Icon({ name, className, ...props }: IconProps) {
  const IconComponent = TablerIcons[name] as React.ElementType;

  if (!IconComponent) {
    console.warn(`Icon '${name}' not found in @tabler/icons-react`);
    return null;
  }

  return <IconComponent className={`w-5 h-5 ${className || ""}`} {...props} />;
}
