/**
 * Validaciones de formato para datos de Ecuador.
 * No verifican con una entidad oficial (SRI/Registro Civil),
 * solo confirman que el formato y el dígito verificador sean válidos.
 */

export function validarCedulaEcuador(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = parseInt(cedula.slice(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito > 6) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula[i], 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }

  const digitoVerificador = (10 - (suma % 10)) % 10;
  return digitoVerificador === parseInt(cedula[9], 10);
}

export function validarTelefonoEcuador(telefono: string): boolean {
  const esCelular = /^09\d{8}$/.test(telefono);
  const esFijo = /^0[2-7]\d{7}$/.test(telefono);
  return esCelular || esFijo;
}
