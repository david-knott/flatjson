var fs = require('fs');
const { exit } = require('process');
var obj = JSON.parse(fs.readFileSync('ntma.json', 'utf8'));

//select id, name from set
//console.log(obj.map(m => { return { "id": m.id, "name": m.name } } ))

//only even ids
//console.log(obj.filter(f => f.id % 2 === 0).map(m => { return { "id": m.id, "name": m.name } } ))

// select all users across all projects.
const res = 
    obj
        .filter( m => m.taskLists.length > 0)
        .filter( m => m.taskLists.flatMap( fm => fm.tasks).length > 0)
        .filter( m => m.taskLists.flatMap( fm => fm.tasks.flatMap(ft => ft.users.filter( u => u.email.includes('davek')))).length > 0)
        .map( m => { 
                return {
                    id: m.id,
                    name: m.name,
                    // check that at least one task has davek assigned.
                    tasks: m.taskLists.filter(tl => tl.tasks.flatMap(ft => ft.users.filter( u => u.email.includes('davek'))).length > 0 ).map(m => {
                        return {
                            name: m.name,
                            tasks: m.tasks.filter(f => f.users.filter( u => u.email.includes('davek')).length > 0 )
                                .map(
                                    m =>  {
                                        return {
                                            name : m.name,
                                           // time: m.users.filter( u => u.email.includes('davek'))
                                        } 
                                    }
                                )
                        };
                    })
                }; 
            }
        )
;



//flatten a JSON object, need to iterate down to the deepest object and return the path

// if current object contains an object

// if current object does not contain an object, return its elements


// I want to flatten a json object.

// is va an object ?
const isObject = (va) =>
    typeof va === 'object'
    && va !== null
    && !Array.isArray(va);

// is va an array ?
const isArray = (va) =>
    typeof va === 'object'
    && va !== null
    && Array.isArray(va);

// traverse the json generating a list of lists.
const traverse = (data, fn, k = '') => {
    if(isObject(data)) {
        // note that dictionary structure information is
        // lost as we return a list for each key
        return Object.keys(data).reduce( (a, c) => {
            const f = traverse(data[c], fn, k + '.' + c);
            return a.concat(f); //list
        }, []);
    } else if(isArray(data)) {
        return data.map(f => traverse(f, fn, k)); //list
    } else {
        // this is the actual data
        return [fn(data, k)]; //list
    }
}


// flatten ar down to an array of values ( this operation causes information loss, the structure of the json is removed )
const f = traverse(ar, (x, k) => {
    let o = new Object;
    o[k] = x;
    return o;
}).flatMap(x => x);


// get unique list of column names
const cols = [...new Set(f.map( f => Object.keys(f)[0] )) ].sort();

//group by col name ( key => list of values )
const colGroups = f.reduce( (a, c) => {
    const col = Object.keys(c)[0];
    (a[col] || (a[col] = new Array())).push(c[col]);
    return a;
}, {});

console.log(colGroups);

// we are geting there.. definately use cartesian product of arrays to generate the denormalised list

/*
a => [ 1 ],

b.c => [2, 4, 6]
b.d => [3, 5, 7]

c.c => [22, 44, 66]
c.d => [33, 55, 77]

1, 2, 3, 22, 33
1, 2, 3, 44, 55
1, 2, 3, 66, 77

1, 4, 5, 22, 33
1, 4, 5, 44, 55
1, 4, 5, 66, 77

1, 6, 7, 22, 33
1, 6, 7, 44, 55
1, 6, 7, 66, 77
*/