
const ar = {
    "a": "a",
	"b": [
		{ "c" : 22, "d" : 33 },
		{ "c" : 44, "d" : 55 },
		{ "d" : 77, "c" : 66 },
        { "z" : 77, "x" : 66 },
        { "d" : 777, "c" : 666, "a": 11 },
        { "d" : 777, "c" : 666, "a": 11, "z": "2", "x": "3" },
        
        
	],
    /*
    "d": {
        "a" : 11,
        "b" : 111,
        "c" : [
            { "a" : 1111, "b" : 2222},
            { "b" : 4444, "a" : 3333 },
            { "x" : 3333, "y" : 4444},
            
        ]
    },
    "e": {
        "a" : 'ea',
        "b" : 'eb'
    }*/
};

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
    console.log(tb, ts);
    if(ts.length == 0) return tb;
    if(tb.length == 0) return ts;
    // iterate through big tables vals
    const res = tb.reduce( (a, row) => {
        a.push(ts.map( srow => srow.concat(row)))
        return a;
    }, []);
    return res.flatMap(x => x);
};

const mergeTables = (t1, t2) => {
    console.log('merge..', t1, t2);
    //create new table from  a cross join on t1rows with t2rows
    const vals = cj(t2.vals, t1.vals);
    return normalize({
        cols: t1.cols.concat(t2.cols),
        vals: vals
    });
};

const normalize = (table) => {
    return table;
};

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
            return row[t1.cols.indexOf(m)] || null;
        });
        //return row.concat(Array(t2rem.length).fill(null));
    });
    const expT2 = t2.vals.map( row => {
        //prepend empty new fields to start of row
        return cols.map(m => {
            // note row is original row in t2
            return row[t2.cols.indexOf(m)] || null;
        });
    });
   
    const res = normalize({
        cols: cols,
        vals: expT1.concat(expT2)
    }); 

    console.log('combine..', t1, t2, res);

    // using vals, create new rows
    return res;
};

const emptyTable = () =>  {
    return {
        cols: [],
        vals: []
    };
};

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
        }, emptyTable());
    } else if(isArray(data)) {
        // if object is an array generate table with multiple rows
        return data.map(f => generateTable(f, key)).reduce( (a, c ) => {
            return combineRows(a, c);
        }, emptyTable());
    } else {
        return singletonTable(key, data);
    }
}


const rootTable = generateTable(rename(ar, x => x));

console.log('root', JSON.stringify(rootTable, null, 2));



  
return;
