import { ComponentProps, ComponentType, ReactNode, ChangeEvent as ReactChangeEvent } from 'react';

// React 19 类型兼容声明
// 解决React 19中FC不再支持泛型和ChangeEvent类型变化的问题

type FC<P = {}> = ComponentType<P>;

type ChangeEvent<T = Element> = ReactChangeEvent<T>;

type MouseEvent<T = Element> = React.MouseEvent<T>;

type KeyboardEvent<T = Element> = React.KeyboardEvent<T>;

type FocusEvent<T = Element> = React.FocusEvent<T>;

type FormEvent<T = Element> = React.FormEvent<T>;

type ReactElement = ReactNode;

type ComponentPropsWithChildren<T extends ComponentType<unknown>> = ComponentProps<T> & {
  children?: ReactNode;
};

export type {
  FC,
  ChangeEvent,
  MouseEvent,
  KeyboardEvent,
  FocusEvent,
  FormEvent,
  ReactElement,
  ComponentPropsWithChildren
};
