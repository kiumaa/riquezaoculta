import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Checkout interno em pausa — a redirecionar para Kambafy external checkout.
// Para reativar: remover este ficheiro e restaurar a versão anterior.
export default function CheckoutPagamentoPage() {
  const kambafyUrl =
    process.env.KAMBAFY_CHECKOUT_URL ||
    "https://pay.kambafy.com/checkout/bd59f082-a243-4c64-87dd-9dc9d5f1e4eb";
  // typed-routes não suporta URLs externas — funciona corretamente em runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  redirect(kambafyUrl as any);
}
