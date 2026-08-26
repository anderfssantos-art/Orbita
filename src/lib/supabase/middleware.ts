import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Renova a sessão se o token estiver perto de expirar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/portal/cadastro");

  const isRotaPublica =
    isAuthRoute || pathname.startsWith("/termos") || pathname.startsWith("/privacidade");

  if (!user && !isRotaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    const ehStaff = Boolean(usuario);

    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = ehStaff ? "/empresas" : "/portal";
      return NextResponse.redirect(url);
    }

    // Fronteira de papel: nenhuma tela de staff é alcançável por um
    // cliente do portal, e vice-versa — mesmo que a RLS já bloqueie os
    // dados, a rota também não deve nem carregar a tela errada.
    const rotaSoDeStaff = ["/empresas", "/servicos", "/dashboard", "/reforma-tributaria", "/rentabilidade", "/eventos"].some((p) =>
      pathname.startsWith(p)
    );
    const rotaSoDeCliente = pathname.startsWith("/portal") && !pathname.startsWith("/portal/cadastro");

    if (rotaSoDeStaff && !ehStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }

    if (rotaSoDeCliente && ehStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/empresas";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
