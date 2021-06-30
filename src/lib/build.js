const fs = require( 'fs' );
let cache = {};

// Helper: retrieves partial VTML's
function getLayout( layoutName ) {

  if ( layoutName in cache ) {
    return cache[ layoutName ];
  }

  let layoutPath = `./layouts/${ layoutName }._vtml`;

  if ( !fs.existsSync( layoutPath ) ) {
    console.log( `${ layoutPath } does not exist.` );
    return '';
  }

  cache[ layoutName ] = fs.readFileSync( layoutPath, 'utf-8' );
  return cache[ layoutName ];

}

// Build VTML
async function build( structure ) {

  let result = '';

  for ( let layout of structure ) {
    if ( !layout.hasOwnProperty( 'layout' ) || !layout.hasOwnProperty( 'sections' ) ) {
      continue;
    }
    let layoutContent = await getLayout( layout.layout );

    for ( let section in layout.sections ) {
      let insertionPoint = new RegExp( `@@(?:\\s+)?${section}(?:\\s+)?@@`, 'g' );

      switch ( layout.sections[ section ].constructor ) {
        case String:
          layoutContent = layoutContent.replace( insertionPoint, layout.sections[ section ] );
          break;
        case Object:
          layoutContent = layoutContent.replace( insertionPoint, await build( [ layout.sections[ section ] ] ) );
          break;
        case Array:
          layoutContent = layoutContent.replace( insertionPoint, await build( layout.sections[ section ] ) );
          break;
        default:
      }
    }

    result += layoutContent;
  }

  // Global: remove double newlines.
  // TODO: maybe should be a setting in the insertion points or layout
  return result.replace( /\n\n/g, '\n' );
}

module.exports = {
	build: build
};
