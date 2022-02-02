var fs = require('fs');
const bigJSON = JSON.parse(fs.readFileSync('test.json', 'utf8'));

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


/**
 * Rename json element keys so they are unique.
 * @param {*} data 
 * @param {*} fn 
 * @param {*} k 
 * @returns new JSON object.
 */
const rename = (data, fn, k = '') => {
    if(isObject(data)) {
        return Object.keys(data).reduce( (a, c) => {
            const f = rename(data[c], fn, k + '.' + c);
            a[k + '.' + c] = f;
            return a;
        }, {});
    } else if(isArray(data)) {
        return data.map(f => rename(f, fn, k));
    } else {
        return fn(data, k);
    }
}

/**
 * Returns cross join of two tables.
 * @param {*} tb 
 * @param {*} ts 
 * @returns a new table.
 */
const cj = (tb, ts) => {
    if(ts.length == 0) return tb;
    if(tb.length == 0) return ts;
    // iterate through big tables vals
    const res = tb.reduce( (a, row) => {
        a.push(ts.map( srow => srow.concat(row)))
        return a;
    }, []);
    return res.flatMap(x => x);
};

/**
 * Merge tables t1 and t2, return their cross product of cols.
 * @param {*} t1 
 * @param {*} t2 
 * @returns a new table.
 */
const mergeTables = (t1, t2) => {
    //create new table from  a cross join on t1rows with t2rows
    const vals = cj(t2.vals, t1.vals);
    return normalize({
        cols: t1.cols.concat(t2.cols),
        vals: vals
    });
};

/**
 * Doesn't do anything.
 * @param {*} table 
 * @returns the same table.
 */
const normalize = (table) => {
    return table;
};

/**
 * Concatentates the rows of two tables and pads out
 * the rows with empty fields there are fields in one
 * table that are not in the other.
 * @param {*} t1 
 * @param {*} t2 
 * @returns a new table.
 */
const combineRows = (t1, t2) => {
    // combine rows and cols, w
    // we need to ensure that any field not present
    // in either are padded out. We also need to 
    // take into account that the order of fields
    // may be different in t1 and t2.

    // fields in t2 that are not in t1
    const t2rem = t2.cols.reduce( (a, c) => {
        if (!t1.cols.includes(c)) {
            a.push(c)
        }
        return a;
    }, []);

    // concat extra cols in t2 to t1 cols
    const cols = t1.cols.concat(t2rem);

    // table 1 has cols 'a', 'b', table 2 has cols 'c', 'd'
    // add new cols 'c', 'd' into table 1 with empty values for 'c' and 'd'
    const expT1 = t1.vals.map( row => {
        //append empty new fields to end of row
        return cols.map(m => {
            // note row is original row in t1
            return undefined !== row[t1.cols.indexOf(m)] ? row[t1.cols.indexOf(m)] : 0;
        });
        //return row.concat(Array(t2rem.length).fill(null));
    });
    const expT2 = t2.vals.map( row => {
        //prepend empty new fields to start of row
        return cols.map(m => {
            // note row is original row in t2
            return undefined !== row[t2.cols.indexOf(m)] ? row[t2.cols.indexOf(m)] : 0;
        });
    });
   
    const res = normalize({
        cols: cols,
        vals: expT1.concat(expT2)
    }); 
    // using vals, create new rows
    return res;
};

/**
 * An empty table.
 */
const emptyTable =
    {
        cols: [],
        vals: []
    };

/**
 * A table with a single item
 * @param {*} key 
 * @param {*} data 
 * @returns a new table.
 */
const singletonTable = (key, data) =>  {
    return {
        cols: [key],
        vals: [[data]]
    };
};

const generateTable = (data, key = null) => {
    if(isObject(data)) {
        return Object.keys(data).reduce( (a, c) => {
            // generate a sub table for the (k, v) pair
            const table = generateTable(data[c], c);
            // merge the tables
            return mergeTables(a, table);
        }, emptyTable);
    } else if(isArray(data)) {
        // if object is an array generate table with multiple rows
        return data.map(f => generateTable(f, key)).reduce( (a, c ) => {
            return combineRows(a, c);
        }, emptyTable);
    } else {
        return singletonTable(key, data);
    }
}


const rootTable = generateTable(rename(bigJSON, x => x));
console.log('root', JSON.stringify(rootTable, null, 2));

//console.log('root', JSON.stringify(rootTable.vals.filter( f => f[rootTable.cols.indexOf('.taskLists.tasks.users.email')]?.includes("davek")), null, 2));



  
return;
