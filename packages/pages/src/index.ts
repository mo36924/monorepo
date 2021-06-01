import changestate from "@mo36924/changestate";
import type { PageComponent } from "@mo36924/page";
import type { Match } from "@mo36924/page-match";
import { useEffect, useState } from "react";

export default (match: Match) => (props: { url: URL }) => {
  const [element, setElement] = useState(match(props.url));

  useEffect(() => {
    const handleChangestate = () => {
      const element = match(new URL(location.href));
      element && (element.type as PageComponent<any>).load().then(() => setElement(element));
    };

    addEventListener(changestate, handleChangestate);

    return () => {
      removeEventListener(changestate, handleChangestate);
    };
  }, []);

  return element;
};
