#!/usr/bin/env node

/* eslint-disable id-length, no-console, no-process-env, no-sync, no-process-exit */
const fs = require('fs')
const {log} = console
const XmlStream = require('xml-stream')
const parseDate = require('./lib/parseDate')
const parseBody = require('./lib/parseBody')
const slugify = require('slugify')

// set the required post type
const postType = 'post'

function generateAuthorId(id) {
  return `author-${id}`
}

function generateCategoryId(id) {
  return `category-${id}`
}

function readFile(path = '') {
  if (!path) {
    return console.error('You need to set path')
  }
  return fs.createReadStream(path)
}

async function buildJSONfromStream(stream) {
  const xml = await new XmlStream(stream)

  return new Promise((res, rej) => {
    /**
     * Get some meta info
     */
    const meta = {}
    xml.on('text: wp:base_site_url', (url) => {
      meta.rootUrl = url.$text
    })

    /**
     * Get the categories
     */
    const categories = []
    xml.on('endElement: category', (wpCategory) => {
      const {nicename} = wpCategory.$
      const category = {
        _type: 'category',
        _id: generateCategoryId(nicename),
        title: nicename,
      }
      categories.push(category)
    })

    /**
     * Get the users
     */
    const users = []
    xml.on('endElement: wp:author', (author) => {
      const user = {
        _type: 'author',
        _id: generateAuthorId(author['wp:author_id']),
        name: author['wp:author_display_name'],
        slug: {
          current: slugify(author['wp:author_login'], {lower: true}),
        },
        email: author['wp:author_email'],
      }
      users.push(user)
    })

    /**
     * Get the posts
     */
    let count = 0
    const posts = []
    xml.collect('wp:postmeta')
    xml.on('endElement: item', (item) => {
      const {title, category, link, description} = item

      // use original permalink
      const removeSlash = link?.endsWith('/') ? link.slice(0, -1) : link
      const slug = removeSlash?.split('/').pop()

      const itemPostType = item['wp:post_type']
      if (itemPostType !== postType) return
      if (count === 0) {
        // useful to log out one single item
        // console.log(item)
      }
      const post = {
        _type: postType,
        _createdAt: parseDate(item),
        title,
        slug: {
          current: slug,
        },
        tags: [
          {
            value: 'tag',
            _ref: generateCategoryId(category?.$?.nicename),
          },
        ],
        description,
        body: parseBody(
          item['wp:postmeta'].find((item) => item['wp:meta_key'] === 'story')['wp:meta_value']
        ),
        publishedAt: parseDate(item),
        author: {
          _type: 'reference',
          _ref: users.find((user) => user.slug.current === item['dc:creator'])._id,
        },
      }
      // useful logging options

      // log all posts before the output
      // console.log(post)

      // log out a specific post
      // if (count === 100) posts.push(post)

      // log out the first post
      // if (count === 0) console.log(post)

      count++

      // add to the array
      posts.push(post)
    })

    // there seems to be a bug where errors is not caught
    xml.on('error', (err) => {
      throw new Error(err)
    })

    xml.on('end', () => {
      const output = [
        /* meta, */
        // ...users,
        ...posts,
        // ...categories,
      ]
      // console.log(output)
      return res(output)
    })
  })
}

async function main() {
  const filename = './wordpress-export.xml'
  const stream = await readFile(filename)
  const output = await buildJSONfromStream(stream)
  output.forEach((doc) => log(JSON.stringify(doc, null, 0)))
}

main()
