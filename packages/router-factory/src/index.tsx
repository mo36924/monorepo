import changestate from "@mo36924/changestate";
import type { Match } from "@mo36924/match-factory";
import { useEffect, useState } from "react";

export default (match: Match) => (props: { url: URL }) => {
  const [context, setContext] = useState(match(props.url));

  useEffect(() => {
    const handleChangestate = () => {
      const context = match(new URL(location.href));
      context && context.route.load().then(() => setContext(context));
    };

    addEventListener(changestate, handleChangestate);

    return () => {
      removeEventListener(changestate, handleChangestate);
    };
  }, []);

  return context && <context.route {...context.props} />;
};
