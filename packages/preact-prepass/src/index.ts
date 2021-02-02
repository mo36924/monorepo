import { options, Component, VNode } from "preact";

if (typeof __SERVER__ === "boolean") {
  // options.__s = options._skipEffects
  (options as any).__s = true;
}

function toChildArray(children: any, array: any[] = []) {
  if (Array.isArray(children)) {
    children.forEach((child) => toChildArray(child, array));
  } else if (children && typeof children === "object") {
    array.push(children);
  }

  return array;
}

function render(this: Component, props: any, _state: any, context: any) {
  this.constructor(props, context);
}

export default function prepass(vnode: VNode, context: any = {}): Promise<any> {
  const type = vnode.type;
  const props = vnode.props;

  if (typeof type === "function") {
    let c: any;

    const contextType = (type as any).contextType;
    // contextType.__c = contextType._id
    const provider = contextType && context[contextType.__c];
    // contextType.__ = contextType._defaultValue
    const componentContext = contextType ? (provider ? provider.props.value : contextType.__) : context;

    if (type.prototype && type.prototype.render) {
      // vnode.__c = vnode._component
      (vnode as any).__c = c = new (type as any)(props, componentContext);
    } else {
      (vnode as any).__c = c = new (Component as any)(props, componentContext);
      c.constructor = type;
      c.render = render;
    }

    c.props = props;
    c.context = componentContext;
    // c.__d = c._dirty
    c.__d = true;
    // c.__v = c._vnode
    c.__v = vnode;

    if (!c.state) {
      c.state = {};
    }

    if ((type as any).getDerivedStateFromProps) {
      c.state = Object.assign({}, c.state, (type as any).getDerivedStateFromProps(c.props, c.state));
    } else if (c.componentWillMount) {
      c.componentWillMount();
    }

    // options.__r = options._render
    if ((options as any).__r) {
      (options as any).__r(vnode);
    }

    const doRender: any =
      typeof __SERVER__ === "boolean"
        ? () => {
            try {
              return Promise.resolve(c.render(c.props, c.state, c.context));
            } catch (e) {
              return e && e.then ? e.then(doRender, doRender) : Promise.reject(e);
            }
          }
        : () => {
            let result: any;
            // options.__s = options._skipEffects
            const previousSkipEffects = (options as any).__s;
            (options as any).__s = true;

            try {
              result = Promise.resolve(c.render(c.props, c.state, c.context));
            } catch (e) {
              result = e && e.then ? e.then(doRender, doRender) : Promise.reject(e);
            }

            (options as any).__s = previousSkipEffects;
            return result;
          };

    return doRender().then((rendered: any) => {
      if (c.getChildContext) {
        context = Object.assign({}, context, c.getChildContext());
      }

      return Promise.all(toChildArray(rendered).map((vnode) => prepass(vnode, context)));
    });
  }

  return Promise.all(toChildArray(props && props.children).map((vnode) => prepass(vnode, context)));
}
