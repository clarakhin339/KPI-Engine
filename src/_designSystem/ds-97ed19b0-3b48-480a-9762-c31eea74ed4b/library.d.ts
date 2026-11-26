import type { ComponentType } from 'react';

/* The bundled design system ships compiled JS only; prop types are not
   published. Components are declared loosely — see components/ui/* wrappers
   for the props actually used. */
type DSComponent = ComponentType<any>;

export const Avatar: DSComponent;
export const AvatarGroup: DSComponent;
export const Badge: DSComponent;
export const Breadcrumb: DSComponent;
export const Button: DSComponent;
export const Card: DSComponent;
export const CardContent: DSComponent;
export const CardFooter: DSComponent;
export const CardHeader: DSComponent;
export const Checkbox: DSComponent;
export const CheckboxGroup: DSComponent;
export const DatePicker: DSComponent;
export const Dialog: DSComponent;
export const DialogContent: DSComponent;
export const DialogFooter: DSComponent;
export const DialogHeader: DSComponent;
export const Drawer: DSComponent;
export const Dropdown: DSComponent;
export const DropdownMenu: DSComponent;
export const Input: DSComponent;
export const LoadingSpinner: DSComponent;
export const Markers: DSComponent;
export const Radio: DSComponent;
export const RadioGroup: DSComponent;
export const Select: DSComponent;
export const Separator: DSComponent;
export const SideNav: DSComponent;
export const Slider: DSComponent;
export const Tab: DSComponent;
export const TabList: DSComponent;
export const TabPanel: DSComponent;
export const Tabs: DSComponent;
export const Thumb: DSComponent;
export const Toast: DSComponent;
export const ToastContainer: DSComponent;
export const ToastProvider: DSComponent;
export const Toggle: DSComponent;
export const Tooltip: DSComponent;
export const Track: DSComponent;
export function cn(...args: unknown[]): string;
export function useDrawer(...args: unknown[]): unknown;
export function useToast(...args: unknown[]): unknown;
