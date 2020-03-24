
imgcmp
==============================================================================
[![buddy pipeline](https://app.buddy.works/hi-there/imgcmp/pipelines/pipeline/205313/badge.svg?token=e8b8f0081f207b429dc2802fa29c9599964cdc62907097473e1c0bd58ec929e2 "buddy pipeline")](https://app.buddy.works/hi-there/imgcmp/pipelines/pipeline/205313)
[![GitHub issues](https://img.shields.io/github/issues/buddy-works/imgcmp.svg)](https://github.com/buddy-works/imgcmp/issues)
[![GitHub stars](https://img.shields.io/github/stars/buddy-works/imgcmp.svg)](https://github.com/buddy-works/imgcmp/stargazers)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/buddy-works/imgcmp/master/LICENSE)

imgcmp is used to compress images from the terminal.

### About Buddy.Works

[**Buddy.Works**](https://buddy.works/) is a Docker-based CI server with auto-deployment tools. Its core feature are pipelines that let developers automate repeatable tasks, for example: build, test and deploy applications, compress images, run SSH scripts, monitor websites, build and push Docker images, or send custom Slack notifications – automatically on push, manually on click, or on time interval.

![](https://buddy.works/data/blog/_images/pipelines/pipelines-5.gif)

Features
------------------------------------------------------------------------------
- compress jpg, png, svg, gif
- three levels of compression
- compress only changed images
- recurrent search
- preserved directory structure 
- integrated as an pipeline action in [**Buddy.Works**](https://buddy.works/)


Installation
------------------------------------------------------------------------------
```
npm install imgcmp
```

Usage
------------------------------------------------------------------------------

The tool will be immediately available after the installation.
You can call `imgcmp -h` to find out more about commands available.

```
./node_modules/.bin/imgcmp --level=3 source/path dest/path
```

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE).
