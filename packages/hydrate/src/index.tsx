import type { Match } from "@mo36924/page-match";
import pages from "@mo36924/pages";
import { StrictMode } from "react";
import { hydrate } from "react-dom";

export default (match: Match) => {
  const url = new URL(location.href);
  const page = match(url);

  if (page) {
    page.type.load().then(() => {
      const Pages = pages(match);

      hydrate(
        <StrictMode>
          <Pages url={url} />
        </StrictMode>,
        document.getElementById("body"),
      );
    });
  }
};
