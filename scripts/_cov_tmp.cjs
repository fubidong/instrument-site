
    const {Client}=require("pg");
    (async()=>{const c=new Client({connectionString:"postgresql://postgres:postgres@localhost:5432/instrument_site"});await c.connect();
    const r=await c.query("SELECT \"coverImage\" FROM \"Product\" WHERE \"brandId\"=(SELECT id FROM \"Brand\" WHERE code='SIGLENT')");console.log(JSON.stringify(r.rows.map(x=>x.coverImage)));await c.end();})();
    