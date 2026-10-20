export async function GET() { return Response.json({maps:[]}, {headers:{"Cache-Control":"no-store"}}); }
export async function POST() { return Response.json({error:"Use o link privado do relatório."}, {status:403}); }
export async function DELETE() { return Response.json({error:"Solicite a exclusão na página de privacidade."}, {status:403}); }
