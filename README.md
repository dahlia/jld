`jld`: JSON-LD CLI tools
========================

This is a small program that deals with JSON-LD.  It can be used to:

 -  `-c`/`--compact=` a JSON-LD document according to a specified context
 -  `-e`/`--expand` a JSON-LD document and remove its context
 -  `-f`/`--flatten` a JSON-LD document so that all deep-level trees are
    flattened to the top-level
 -  `-n`/`--normalize` a JSON-LD document using RDFC-1.0 (formerly URDNA2015)
    so that it can be used for hashing, comparison, and so on
 -  serialize a document `-r`/`--to-rdf` (N-Quads)

For more information, see `-h`/`--help`.


Installation
------------

You can install `jld` using `deno install`:

~~~~ console
$ deno install --allow-read --allow-net https://deno.land/x/jld/jld.ts
~~~~


Usage
-----

You can simply pass a URL of a JSON-LD document to `jld`:

~~~~ console
$ jld --expand https://todon.eu/users/hongminhee
[
  {
    "https://www.w3.org/ns/activitystreams#alsoKnownAs": [
      {
        "@id": "https://mastodon.social/users/hongminhee"
      }
    ],
    ...
  }
]
~~~~

Or a local file path:

~~~~ console
$ jld --expand ./document.jsonld
~~~~

Or a JSON-LD document via the standard input:

~~~~ console
$ jld --expand < ./document.jsonld
~~~~