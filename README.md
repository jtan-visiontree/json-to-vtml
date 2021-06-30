## json-to-vtml



This project's aim is to create an executable that takes in a special json format and convert it to VTML.



#### Standard Format

```json
[
  {
    "layout": "name of the file in the layouts directory",
    "sections": {
      "labeled in the file with {{ }}": "content",
      "heading": "Heading Name",
      "body": {
        "layout": "name of the file in the layouts directory",
        ...
      }
  	}
  }
]
```

`layout` - must be *string*.

`sections` - must an *object* or an *array of objects*.

- Property names must reflect the *"anchors"* in the layout.
- Property values can either be a *string* or another *standard format object*.



#### Layout

Is a regular html file with *@@ label name @@* anchors that tells the parser where to inject the code. A valid anchor is formatted as follows: *At sign*, *At sign*, *whitespace (optional)*, *label name*,  *whitespace (optional)*, *At sign*,  *At sign*.

Examples of valid anchors:

- `<p>@@ statement1 @@</p>`
- `<div class="header">@@header-name@@</div>`

Examples of invalid anchors:

- `<p>@ @ statement1 @ @</p>`
- `<div class="header">@@header-name@ @</div>`



#### Layout Evaluation

Is a function that evaulates a *layout* file and returns a list of valid anchors.



#### Layout Parser

