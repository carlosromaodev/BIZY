/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/carrinho` | `/carrinho`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/lojas` | `/lojas`; params?: Router.UnknownInputParams; } | { pathname: `/loja/[slug]`, params: Router.UnknownInputParams & { slug: string | number; } } | { pathname: `/produto/[codigo]`, params: Router.UnknownInputParams & { codigo: string | number; } };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/carrinho` | `/carrinho`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/lojas` | `/lojas`; params?: Router.UnknownOutputParams; } | { pathname: `/loja/[slug]`, params: Router.UnknownOutputParams & { slug: string; } } | { pathname: `/produto/[codigo]`, params: Router.UnknownOutputParams & { codigo: string; } };
      href: Router.RelativePathString | Router.ExternalPathString | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/carrinho${`?${string}` | `#${string}` | ''}` | `/carrinho${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/lojas${`?${string}` | `#${string}` | ''}` | `/lojas${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/carrinho` | `/carrinho`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/lojas` | `/lojas`; params?: Router.UnknownInputParams; } | `/loja/${Router.SingleRoutePart<T>}` | `/produto/${Router.SingleRoutePart<T>}` | { pathname: `/loja/[slug]`, params: Router.UnknownInputParams & { slug: string | number; } } | { pathname: `/produto/[codigo]`, params: Router.UnknownInputParams & { codigo: string | number; } };
    }
  }
}
