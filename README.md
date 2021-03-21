# Joplin Trash Plugin

This is a quick, minimal implementation of a "Move to Trash" plugin

https://discourse.joplinapp.org/t/trashcan/3998

## TODO / someday maybe

Not sure how to do these without [metadata](https://discourse.joplinapp.org/t/additional-metadata/3079/5)

* Empty trash (that automatically purges old notes in trash)
* Remove from trash (back to original folder)

## Building the plugin

The plugin is built using Webpack, which creates the compiled code in `/dist`. A JPL archive will also be created at the root, which can use to distribute the plugin.

To build the plugin, simply run `npm run dist`.

## Updating the plugin framework

To update the plugin framework, run `npm run update`.

