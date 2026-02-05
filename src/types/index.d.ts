// React 19 类型声明文件
// 解决React 19中FC和ChangeEvent等类型变化问题

import type { ReactNode, ComponentType, ComponentProps, ChangeEvent as ReactChangeEvent, MouseEvent as ReactMouseEvent, FocusEvent as ReactFocusEvent, KeyboardEvent as ReactKeyboardEvent, FormEvent as ReactFormEvent, EffectCallback, DependencyList } from 'react';

// FC 类型兼容
type FC<P = object> = ComponentType<P & { children?: ReactNode }>;

// ChangeEvent 类型
type ChangeEvent<T = Element> = ReactChangeEvent<T>;

// 常用事件类型
type MouseEvent<T = Element> = ReactMouseEvent<T>;
type FocusEvent<T = Element> = ReactFocusEvent<T>;
type KeyboardEvent<T = Element> = ReactKeyboardEvent<T>;
type FormEvent<T = Element> = ReactFormEvent<T>;

// Effect类型
type EffectCallback = () => void | (() => void);
type UseEffect = (effect: EffectCallback, deps?: DependencyList) => void;

// 导出所有类型
export type {
  FC,
  ChangeEvent,
  MouseEvent,
  FocusEvent,
  KeyboardEvent,
  FormEvent,
  EffectCallback,
  UseEffect
};

export { ReactNode };
