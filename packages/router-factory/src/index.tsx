import changestate from "@mo36924/changestate";
import type { Match } from "@mo36924/match-factory";
import { useEffect, useState } from "react";

export default (match: Match) => (props: { url: URL }) => {
  const [element, setElement] = useState(match(props.url));

  useEffect(() => {
    const handleChangestate = () => {
      setElement(match(new URL(location.href)));
    };

    addEventListener(changestate, handleChangestate);

    return () => {
      removeEventListener(changestate, handleChangestate);
    };
  }, []);

  return element;
};
