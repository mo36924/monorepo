import { options, Component, VNode } from "preact";

function assign(obj: any, props: any) {
  for (let i in props) obj[i] = props[i];
  return obj;
}

function getChildren(accumulator: any[], children: any) {
  if (Array.isArray(children)) {
    children.reduce(getChildren, accumulator);
  } else if (children && typeof children === "object") {
    accumulator.push(children);
  }

  return accumulator;
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
      c.state = assign(assign({}, c.state), (type as any).getDerivedStateFromProps(c.props, c.state));
    } else if (c.componentWillMount) {
      c.componentWillMount();
    }

    // options.__r = options._render
    if ((options as any).__r) {
      (options as any).__r(vnode);
    }

    const doRender = () => {
      try {
        // options.__s = options._skipEffects
        const previousSkipEffects = (options as any).__s;
        (options as any).__s = true;
        const renderResult = Promise.resolve(c.render(c.props, c.state, c.context));
        (options as any).__s = previousSkipEffects;
        return renderResult;
      } catch (e) {
        return e && e.then ? e.then(doRender, doRender) : Promise.reject(e);
      }
    };

    return doRender().then((rendered: any) => {
      if (c.getChildContext) {
        context = assign(assign({}, context), c.getChildContext());
      }

      return Promise.all(getChildren([], rendered).map((vnode) => prepass(vnode, context)));
    });
  }

  return Promise.all(getChildren([], props && props.children).map((vnode) => prepass(vnode, context)));
}
