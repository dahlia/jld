import {
  ArgumentValue,
  Command,
} from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import jsonld from "npm:jsonld";
import { toText } from "https://deno.land/std@0.208.0/streams/mod.ts";
import { defaultTheme, highlight } from "https://deno.land/x/stx@0.1.1/mod.ts";

function jsonType({ label, name, value }: ArgumentValue): unknown {
  try {
    return JSON.parse(value);
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`${label} ${name} must be a valid JSON; ${e.message}`);
    }
    throw e;
  }
}

function mediaTypeType({ label, name, value }: ArgumentValue): string {
  if (!value.match(/^[a-z]+\/[a-z0-9.+-]+$/i)) {
    throw new Error(`${label} ${name} must be a valid media type`);
  }
  return value;
}

const command = new Command()
  .name("jld")
  .description("JSON-LD CLI tools")
  .version("0.1.2")
  .type("json", jsonType)
  .type("media_type", mediaTypeType)
  .arguments("[source:file]")
  .option(
    "-c, --compact <context:json>",
    "compact a document according to a specified context",
    { conflicts: ["expand", "flatten", "normalize", "to-rdf"] },
  )
  .option("-e, --expand", "expand a document and remove its context", {
    conflicts: ["compact", "flatten", "normalize", "to-rdf"],
  })
  .option(
    "-f, --flatten",
    "flatten a document so that " +
      "all deep-level trees are flattened to the top-level",
    { conflicts: ["compact", "expand", "normalize", "to-rdf"] },
  )
  .option(
    "-n, --normalize, -C, --canonize, --canonicalize",
    "normalize (canonize) a document using RDFC-1.0 (formerly URDNA2015) " +
      "so that it can be used for hashing, comparison, and so on",
    { conflicts: ["compact", "expand", "flatten", "to-rdf"] },
  )
  .option("-r, --to-rdf", "serialize a document to N-Quads (RDF)", {
    conflicts: ["compact", "expand", "flatten", "normalize"],
  })
  .option(
    "-a, --accept <media_type:media_type>",
    "specify the media type to send Accept header with " +
      "(used only when source is a URL)",
    {
      default: "application/ld+json",
    },
  );

function prettyPrintJson(json: unknown) {
  const formatted = JSON.stringify(json, null, 2);
  if (Deno.isatty(Deno.stdout.rid)) {
    console.log(highlight(defaultTheme, "javascript", formatted));
  } else {
    console.log(formatted);
  }
}

async function run(
  { args, options }: Awaited<ReturnType<typeof command.parse>>,
) {
  let json: string;
  if (args[0] == null) {
    json = await toText(Deno.stdin.readable);
  } else if (
    args[0].startsWith("https://") || args[0].startsWith("http://") ||
    args[0].startsWith("file://")
  ) {
    const response = await fetch(args[0], {
      headers: { Accept: options.accept },
    });
    json = await response.text();
  } else {
    json = await Deno.readTextFile(args[0]);
  }

  const doc = JSON.parse(json);
  if (options.compact != null) {
    const compacted = await jsonld.compact(doc, options.compact);
    prettyPrintJson(compacted);
  } else if (options.expand) {
    const expanded = await jsonld.expand(doc);
    prettyPrintJson(expanded);
  } else if (options.flatten) {
    const flattened = await jsonld.flatten(doc);
    prettyPrintJson(flattened);
  } else if (options.normalize) {
    const normalized = await jsonld.normalize(doc);
    console.log(normalized);
  } else if (options.toRdf) {
    const rdf = await jsonld.toRDF(doc);
    prettyPrintJson(rdf);
  } else {
    await jsonld.expand(doc); // for validation
    prettyPrintJson(doc);
  }
}

async function main() {
  const result = await command.parse(Deno.args);
  try {
    await run(result);
  } catch (e) {
    result.cmd.throw(e);
  }
}

if (import.meta.main) await main();
