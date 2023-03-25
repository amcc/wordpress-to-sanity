# Wordpress to Sanity

⚠️ Not production code
This is primarily an example of how you can script a Wordpress to [Sanity.io](https://www.sanity.io) migration.
You most probably have to tweak and edit the code to fit to your need.

## Getting started

1. Clone this repo
2. Set `const postType` at the top of `migrate.js` for custom post types
3. Set `const filename` in `migrate.js` to the path of your wordpress export xml file
4. Run `node src/migrate.js` to log out the converted sanity documents in the terminal
5. Pipe the output to an import file by `node src/migrate.js > myImportfile.ndjson`
6. Try to import the file with `sanity dataset import myImportfile.ndjson` in your Sanity project folder

Mostly probably there is additional content that this script doesn't migrate, however, it should cover the most usual patterns, so that you can build it out for your specific use case.

## some helpful tips

- the bug described below means that if there's an issue you'll get nothing generated
- console log stuff to check the output before you go
- there's a counter variable so you can just test a single post
- liberal use of optional chaining will help you! i.e. `?.` on objects

- This script reads the wordpress export XML file
- This example is based on the blog template schema
- There's a bug in `xml-stream` where it doesn't seem to emit errors
- Debugging deserialization (`parseBody.js`) is easier with the script in `/test`
- Remember to add additional supported custom types to `/schemas/defaultSchema.js`
- The HTML is sanitized, but _most_ HTML tags are allowed (check `/lib/sanitizeHTML.js`)

## to do

- update various dependencies to work as well as possible with sanity v.3
- https://www.npmjs.com/package/@sanity/block-tools this package does the heavy lifting for blocks which is the only really difficult part of this. Currently formatting isn't quite right.
