import type { PageComponent } from "@mo36924/page";
import type { Match } from "@mo36924/page-match";
import pages from "@mo36924/pages";
import { hydrate } from "preact";

export default (match: Match) => {
  const url = new URL(location.href);
  const page = match(url);

  if (page) {
    (page.type as PageComponent<any>).load().then(() => {
      const Pages = pages(match);

      hydrate(<Pages url={url} />, document.getElementById("body")!);
    });
  }
};
