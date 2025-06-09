const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const pool = require('./db');


const token = '7597057776:AAEWjSDt51rng3We7CljUfW3aWP119ke9TQ';
const bot = new TelegramBot(token, { polling: true });

const userState = {};

const mostrarMenuPrincipal = (chatId) => {
  userState[chatId] = { etapa: 'menu' };
  bot.sendMessage(chatId, '📋 Menú principal:', {
    reply_markup: {
      keyboard: [
        ['🛒 Realizar pedido'],
        ['✏️ Modificar pedido', '🗑️ Eliminar pedido'],
        ['📦 Revisar stock', '👕 Ver productos'],
        ['📋 Ver pedidos'],
        ['❌ Cancelar']
      ],
      resize_keyboard: true
    }
  });
};

bot.onText(/\/start/i, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `👋 ¡Hola ${msg.from.first_name}! Bienvenido a tu asistente de ventas. Elige la opción que desees realizar.`)
    .then(() => {
      mostrarMenuPrincipal(chatId);
    });
  return;
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const texto = msg.text?.toLowerCase();
  if (texto.startsWith('/start')) return;
  if (texto.includes('cancelar')) {
    userState[chatId] = { etapa: 'cancelado' };
    return bot.sendMessage(chatId, '❌ Operación cancelada. ¿Querés volver al menú principal?', {
      reply_markup: {
        keyboard: [['Sí', 'No']],
        resize_keyboard: true
      }
    });
  }

  if (texto === 'sí' && userState[chatId]?.etapa === 'cancelado') {
    return mostrarMenuPrincipal(chatId);
  }

  if (texto === 'no' && userState[chatId]?.etapa === 'cancelado') {
    userState[chatId] = {};
    return bot.sendMessage(chatId, '👍 Entendido. Podés usar /start cuando quieras volver al menú.');
  }

  const estado = userState[chatId] || {};

  if (!estado.etapa || estado.etapa === 'menu') {
    if (texto === '🛒 realizar pedido') {
      userState[chatId] = { etapa: 'esperando_prenda' };
      return bot.sendMessage(chatId, '¿Qué tipo de prenda querés?', {
        reply_markup: {
          keyboard: [
            ['Camiseta', 'Falda', 'Sudadera'],
            ['Chaqueta', 'Pantalón', 'Camisa'],
            ['❌ Cancelar']
          ],
          resize_keyboard: true
        }
      });
    }

    if (texto === '✏️ modificar pedido') {
      userState[chatId] = { etapa: 'esperando_id_modificar' };
      return bot.sendMessage(chatId, '✏️ Ingresá el ID del pedido que querés modificar:', {
        reply_markup: {
          keyboard: [['❌ Cancelar']],
          resize_keyboard: true
        }
      });
    }

    if (texto === '🗑️ eliminar pedido') {
      userState[chatId] = { etapa: 'esperando_id_eliminar' };
      return bot.sendMessage(chatId, '🗑️ Ingresá el ID del pedido que querés eliminar:', {
        reply_markup: {
          keyboard: [['❌ Cancelar']]
        , resize_keyboard: true }
      });
    }

    if (texto === '📋 ver pedidos') {
      try {
        const res = await axios.get('https://agente-ventas-telegram.onrender.com/pedidos');
        const pedidos = res.data;

        if (!pedidos.length) {
          return bot.sendMessage(chatId, '📭 No hay pedidos registrados.');
        }

        const lista = pedidos
          .map(
            (p) =>
              `🧾 ID: ${p.id}\n👕 ${p.tipo_prenda} - ${p.color} - Talla ${p.talla}\n📦 Cantidad: ${p.cantidad}\n🕒 Fecha: ${new Date(p.fecha).toLocaleString()}`
          )
          .join('\n\n');

        return bot.sendMessage(chatId, `📋 Lista de pedidos:\n\n${lista}`);
      } catch (err) {
        console.error(err);
        return bot.sendMessage(chatId, '❌ Error al obtener los pedidos.');
      }
    }

    if (texto === '📦 revisar stock') {
      userState[chatId] = { etapa: 'stock_prenda' };
      return bot.sendMessage(chatId, '🔎 ¿Qué tipo de prenda querés consultar?', {
        reply_markup: {
          keyboard: [
            ['Camiseta', 'Falda', 'Sudadera'],
            ['Chaqueta', 'Pantalón', 'Camisa'],
            ['❌ Cancelar']
          ],
          resize_keyboard: true
        }
      });
    }

    if (texto === '👕 ver productos') {
  userState[chatId] = { etapa: 'esperando_prenda_ver' };
  return bot.sendMessage(chatId, '👕 Estas son nuestras prendas, elegí una para ver todos sus modelos:', {
    reply_markup: {
      keyboard: [
        ['Camiseta', 'Falda', 'Sudadera'],
        ['Chaqueta', 'Pantalón', 'Camisa'],
        ['❌ Cancelar']
      ],
      resize_keyboard: true
            }
        });
    }

      return bot.sendMessage(chatId, '⚠️ Opción no reconocida. Elegí una de las opciones del menú:', {
    reply_markup: {
      keyboard: [
        ['🛒 Realizar pedido'],
        ['✏️ Modificar pedido', '🗑️ Eliminar pedido'],
        ['📦 Revisar stock', '👕 Ver productos'],
        ['📋 Ver pedidos'],
        ['❌ Cancelar']
      ],
      resize_keyboard: true
    }
  });
  }

  if (estado.etapa === 'esperando_id_modificar') {
    const id = parseInt(texto);
    if (isNaN(id)) {
      return bot.sendMessage(chatId, '⚠️ Por favor ingresá un número de ID válido o cancelá.');
    }

    try {
      const res = await axios.get(`https://agente-ventas-telegram.onrender.com/pedidos/${id}`);
      const pedido = res.data;
      const fechaCreacion = new Date(pedido.fecha);
      const ahora = new Date();
      const minutos = (ahora - fechaCreacion) / 60000;

      if (minutos > 5) {
        userState[chatId] = {};
        bot.sendMessage(chatId, '⏳ Ya pasaron más de 5 minutos desde que se creó este pedido, no se puede modificar.');
        return mostrarMenuPrincipal(chatId);
      }

      userState[chatId] = { etapa: 'modificar_prenda', id_modificar: id };
      return bot.sendMessage(chatId, '¿Qué tipo de prenda querés establecer para este pedido?', {
        reply_markup: {
          keyboard: [
            ['Camiseta', 'Falda', 'Sudadera'],
            ['Chaqueta', 'Pantalón', 'Camisa'],
            ['❌ Cancelar']
          ],
          resize_keyboard: true
        }
      });

    } catch (error) {
      console.error(error);
      userState[chatId] = {};
      await bot.sendMessage(chatId, '❌ No se encontró el pedido o hubo un error.');
      return mostrarMenuPrincipal(chatId);
    }
  }

  if (estado.etapa === 'modificar_prenda') {
  const opcionesValidas = ['camiseta', 'falda', 'sudadera', 'chaqueta', 'pantalón', 'camisa'];
  if (!opcionesValidas.includes(texto)) {
    return bot.sendMessage(chatId, '⚠️ Opción no válida. Por favor seleccioná una prenda de las opciones disponibles.', {
      reply_markup: {
        keyboard: [
          ['Camiseta', 'Falda', 'Sudadera'],
          ['Chaqueta', 'Pantalón', 'Camisa'],
          ['❌ Cancelar']
        ],
        resize_keyboard: true
      }
    });
  }
  userState[chatId] = { ...estado, etapa: 'modificar_talla', tipo_prenda: texto };
  return bot.sendMessage(chatId, '¿Qué talla querés establecer?', {
    reply_markup: {
      keyboard: [['S', 'M', 'L'], ['XL', 'XXL'], ['❌ Cancelar']],
      resize_keyboard: true
    }
  });
}

  if (estado.etapa === 'modificar_talla') {
  const opcionesTalla = ['s', 'm', 'l', 'xl', 'xxl'];
  if (!opcionesTalla.includes(texto)) {
    return bot.sendMessage(chatId, '⚠️ Opción no válida. Por favor seleccioná una talla válida de las opciones.', {
      reply_markup: {
        keyboard: [['S', 'M', 'L'], ['XL', 'XXL'], ['❌ Cancelar']],
        resize_keyboard: true
      }
    });
  }
  userState[chatId] = { ...estado, etapa: 'modificar_color', talla: texto };
  return bot.sendMessage(chatId, '¿Qué color preferís?', {
    reply_markup: {
      keyboard: [
        ['Verde', 'Blanco', 'Negro'],
        ['Amarillo', 'Gris', 'Azul', 'Rojo'],
        ['❌ Cancelar']
      ],
      resize_keyboard: true
    }
  });
}

  if (estado.etapa === 'modificar_color') {
  const opcionesColor = ['verde', 'blanco', 'negro', 'amarillo', 'gris', 'azul', 'rojo'];
  if (!opcionesColor.includes(texto)) {
    return bot.sendMessage(chatId, '⚠️ Opción no válida. Por favor seleccioná un color de las opciones.', {
      reply_markup: {
        keyboard: [
          ['Verde', 'Blanco', 'Negro'],
          ['Amarillo', 'Gris', 'Azul', 'Rojo'],
          ['❌ Cancelar']
        ],
        resize_keyboard: true
      }
    });
  }

  userState[chatId] = { ...estado, etapa: 'modificar_cantidad', color: texto };
  return bot.sendMessage(chatId, '¿Qué cantidad querés establecer?', {
    reply_markup: {
      keyboard: [['❌ Cancelar']],
      resize_keyboard: true
    }
  });
}

  if (estado.etapa === 'modificar_cantidad') {
  const cantidad = parseInt(texto);
  if (isNaN(cantidad)) {
    return bot.sendMessage(chatId, '⚠️ Por favor ingresá una cantidad válida.');
  }

  const { tipo_prenda, talla, color, id_modificar } = estado;

  try {
    const check = await axios.post('https://agente-ventas-telegram.onrender.com/productos/search', {
      tipo_prenda,
      talla,
      color
    });

    const disponibles = check.data.filter(
      (p) => p.disponible.toLowerCase() === 'si'
    );

    if (!disponibles.length) {
      userState[chatId] = {};
      bot.sendMessage(
        chatId,
        `❌ El producto ya no está disponible para modificar el pedido.\n👕 ${tipo_prenda} - ${color} - ${talla}`
      );
      return mostrarMenuPrincipal(chatId);
    }

    const producto = disponibles[0];

    if (cantidad > producto.cantidad_disponible) {
      userState[chatId] = {};
      bot.sendMessage(
        chatId,
        `⚠️ Solo hay ${producto.cantidad_disponible} unidades disponibles.\nNo podés modificar el pedido a ${cantidad} unidades.`
      );
      return mostrarMenuPrincipal(chatId);
    }

    const res = await axios.put(`https://agente-ventas-telegram.onrender.com/editar-pedido/${id_modificar}`, {
      tipo_prenda,
      talla,
      color,
      cantidad
    });

    userState[chatId] = {};
    bot.sendMessage(chatId, `✅ Pedido actualizado correctamente:\n🧾 ID: ${res.data.id}\n👕 ${res.data.tipo_prenda} - ${res.data.color} - ${res.data.talla}\n📦 Cantidad: ${res.data.cantidad}`);
    return mostrarMenuPrincipal(chatId);
  } catch (error) {
    console.error(error);
    return bot.sendMessage(chatId, '❌ No se pudo modificar el pedido.');
  }
}

  if (estado.etapa === 'esperando_id_eliminar') {
    const id = parseInt(texto);
    if (isNaN(id)) {
      return bot.sendMessage(chatId, '⚠️ Por favor ingresá un número de ID válido o cancelá.');
    }

    try {
      const res = await axios.delete(`https://agente-ventas-telegram.onrender.com/pedidos/${id}`);
      userState[chatId] = {};
      bot.sendMessage(chatId, `✅ Pedido con ID ${id} eliminado correctamente.`);
      return mostrarMenuPrincipal(chatId);
    } catch (err) {
      console.error(err);
      return bot.sendMessage(chatId, '❌ No se pudo eliminar el pedido. ¿Estás seguro que el ID existe?');
    }
  }

 if (estado.etapa === 'esperando_prenda') {
  const opcionesValidas = ['camiseta', 'falda', 'sudadera', 'chaqueta', 'pantalón', 'camisa'];
  if (!opcionesValidas.includes(texto)) {
    return bot.sendMessage(chatId, '⚠️ Opción no válida. Por favor seleccioná una prenda de las opciones disponibles.', {
      reply_markup: {
        keyboard: [
          ['Camiseta', 'Falda', 'Sudadera'],
          ['Chaqueta', 'Pantalón', 'Camisa'],
          ['❌ Cancelar']
        ],
        resize_keyboard: true
      }
    });
  }
  userState[chatId] = { etapa: 'esperando_talla', tipo_prenda: texto };
  return bot.sendMessage(chatId, '¿Qué talla necesitás?', {
    reply_markup: {
      keyboard: [['S', 'M', 'L'], ['XL', 'XXL'], ['❌ Cancelar']],
      resize_keyboard: true
    }
  });
}

  if (estado.etapa === 'esperando_talla') {
  const opcionesTalla = ['s', 'm', 'l', 'xl', 'xxl'];
  if (!opcionesTalla.includes(texto)) {
    return bot.sendMessage(chatId, '⚠️ Opción no válida. Por favor seleccioná una talla válida de las opciones.', {
      reply_markup: {
        keyboard: [['S', 'M', 'L'], ['XL', 'XXL'], ['❌ Cancelar']],
        resize_keyboard: true
      }
    });
  }
  userState[chatId] = { ...estado, etapa: 'esperando_color', talla: texto };
  return bot.sendMessage(chatId, '¿Qué color preferís?', {
    reply_markup: {
      keyboard: [
        ['Verde', 'Blanco', 'Negro'],
        ['Amarillo', 'Gris', 'Azul', 'Rojo'],
        ['❌ Cancelar']
      ],
      resize_keyboard: true
    }
  });
}

  if (estado.etapa === 'esperando_color') {
  const opcionesColor = ['verde', 'blanco', 'negro', 'amarillo', 'gris', 'azul', 'rojo'];
  if (!opcionesColor.includes(texto)) {
    return bot.sendMessage(chatId, '⚠️ Opción no válida. Por favor seleccioná un color de las opciones.', {
      reply_markup: {
        keyboard: [
          ['Verde', 'Blanco', 'Negro'],
          ['Amarillo', 'Gris', 'Azul', 'Rojo'],
          ['❌ Cancelar']
        ],
        resize_keyboard: true
      }
    });
  }
  userState[chatId] = { ...estado, etapa: 'esperando_cantidad', color: texto };
  return bot.sendMessage(chatId, '¿Qué cantidad querés pedir?', {
    reply_markup: {
      keyboard: [['❌ Cancelar']],
      resize_keyboard: true
    }
  });
}

  if (estado.etapa === 'esperando_cantidad') {
  const cantidad = parseInt(texto);
  if (isNaN(cantidad)) {
    return bot.sendMessage(chatId, '⚠️ Por favor ingresá un número válido o cancelá.');
  }

  const { tipo_prenda, talla, color } = estado;

  try {
    const check = await axios.post('https://agente-ventas-telegram.onrender.com/productos/search', {
      tipo_prenda,
      talla,
      color
    });

    const disponibles = check.data.filter(
      (p) => p.disponible.toLowerCase() === 'si'
    );

    if (!disponibles.length) {
      userState[chatId] = {};
      bot.sendMessage(
        chatId,
        `❌ El producto seleccionado no está disponible en este momento.\n\n👕 ${tipo_prenda} - ${color} - Talla ${talla}`
      );
      return mostrarMenuPrincipal(chatId);
    }

    const producto = disponibles[0];

    if (cantidad > producto.cantidad_disponible) {
      userState[chatId] = {};
      bot.sendMessage(
        chatId,
        `⚠️ Solo hay ${producto.cantidad_disponible} unidades disponibles para este producto.\nNo se puede realizar el pedido por ${cantidad} unidades.`
      );
      return mostrarMenuPrincipal(chatId);
    }

    const response = await axios.post('https://agente-ventas-telegram.onrender.com/pedidos', {
      tipo_prenda,
      talla,
      color,
      cantidad
    });

    userState[chatId] = {};
    bot.sendMessage(
      chatId,
      `✅ Pedido registrado con éxito:\n🧾 ID: ${response.data.id}\n👕 ${tipo_prenda} - ${color} - ${talla}\n📦 Cantidad: ${cantidad}`
    );
    return mostrarMenuPrincipal(chatId);
  } catch (err) {
    console.error('Error en verificación o registro:', err.message);
    return bot.sendMessage(chatId, '❌ Hubo un error al verificar disponibilidad o registrar el pedido.');
  }
}

  if (estado.etapa === 'esperando_prenda_stock') {
  try {
    const res = await axios.get(`https://agente-ventas-telegram.onrender.com/stock?tipo_prenda=${encodeURIComponent(texto)}`);
    if (!res.data.length) {
      return bot.sendMessage(chatId, '❌ No se encontró stock para esa prenda.');
    }

    const stock = res.data[0].cantidad_disponible;
    userState[chatId] = {};
    bot.sendMessage(chatId, `📦 Stock disponible para ${texto}: ${stock} unidades.`);
    return mostrarMenuPrincipal(chatId);
  } catch (error) {
    console.error(error);
    return bot.sendMessage(chatId, '❌ Error al consultar stock.');
  }
}

 if (estado.etapa === 'stock_prenda') {
  const opcionesPrenda = ['camiseta', 'falda', 'sudadera', 'chaqueta', 'pantalón', 'camisa'];
  if (!opcionesPrenda.includes(texto)) {
    return bot.sendMessage(chatId, '⚠️ Opción no válida. Por favor seleccioná una prenda válida.', {
      reply_markup: {
        keyboard: [
          ['Camiseta', 'Falda', 'Sudadera'],
          ['Chaqueta', 'Pantalón', 'Camisa'],
          ['❌ Cancelar']
        ],
        resize_keyboard: true
      }
    });
  }

  userState[chatId] = { etapa: 'stock_talla', tipo_prenda: texto };
  return bot.sendMessage(chatId, '📏 ¿Qué talla querés consultar?', {
    reply_markup: {
      keyboard: [['S', 'M', 'L'], ['XL', 'XXL'], ['❌ Cancelar']],
      resize_keyboard: true
    }
  });
}

  if (estado.etapa === 'stock_talla') {
  const opcionesTalla = ['s', 'm', 'l', 'xl', 'xxl'];
  if (!opcionesTalla.includes(texto)) {
    return bot.sendMessage(chatId, '⚠️ Opción no válida. Por favor seleccioná una talla válida.', {
      reply_markup: {
        keyboard: [['S', 'M', 'L'], ['XL', 'XXL'], ['❌ Cancelar']],
        resize_keyboard: true
      }
    });
  }

  userState[chatId] = { ...estado, etapa: 'stock_color', talla: texto };
  return bot.sendMessage(chatId, '🎨 ¿Qué color te interesa?', {
    reply_markup: {
      keyboard: [
        ['Verde', 'Blanco', 'Negro'],
        ['Amarillo', 'Gris', 'Azul', 'Rojo'],
        ['❌ Cancelar']
      ],
      resize_keyboard: true
    }
  });
}

  if (estado.etapa === 'stock_color') {
  const opcionesColor = ['verde', 'blanco', 'negro', 'amarillo', 'gris', 'azul', 'rojo'];
  if (!opcionesColor.includes(texto)) {
    return bot.sendMessage(chatId, '⚠️ Opción no válida. Por favor seleccioná un color de las opciones.', {
      reply_markup: {
        keyboard: [
          ['Verde', 'Blanco', 'Negro'],
          ['Amarillo', 'Gris', 'Azul', 'Rojo'],
          ['❌ Cancelar']
        ],
        resize_keyboard: true
      }
    });
  }

  const { tipo_prenda, talla } = estado;
  const color = texto;

  try {
    const res = await axios.get(`https://agente-ventas-telegram.onrender.com/stock?tipo_prenda=${encodeURIComponent(tipo_prenda)}&talla=${encodeURIComponent(talla)}&color=${encodeURIComponent(color)}`);

    if (!res.data.length) {
      return bot.sendMessage(chatId, '❌ No se encontró stock para esa combinación.');
    }

    const stock = res.data[0].cantidad_disponible;
    userState[chatId] = {};
    bot.sendMessage(chatId, `📦 Stock disponible para ${tipo_prenda} ${color} talla ${talla}: ${stock} unidades.`);
    return mostrarMenuPrincipal(chatId);
  } catch (error) {
    console.error(error);
    return bot.sendMessage(chatId, '❌ Error al consultar stock.');
  }
}

  if (estado.etapa === 'esperando_prenda_ver') {
  const opcionesValidas = ['camiseta', 'falda', 'sudadera', 'chaqueta', 'pantalón', 'camisa'];
  if (!opcionesValidas.includes(texto)) {
    return bot.sendMessage(chatId, '⚠️ Opción no válida. Por favor seleccioná una prenda válida de las opciones.', {
      reply_markup: {
        keyboard: [
          ['Camiseta', 'Falda', 'Sudadera'],
          ['Chaqueta', 'Pantalón', 'Camisa'],
          ['❌ Cancelar']
        ],
        resize_keyboard: true
      }
    });
  }

  try {
    const res = await axios.get(`https://agente-ventas-telegram.onrender.com/productos/filtrar?tipo_prenda=${encodeURIComponent(texto)}`);
    const productos = res.data;

    if (!productos.length) {
      return bot.sendMessage(chatId, '❌ No se encontraron productos para ese tipo de prenda.');
    }

    const ordenTalles = ['S', 'M', 'L', 'XL', 'XXL'];
    productos.sort((a, b) => ordenTalles.indexOf(a.talla) - ordenTalles.indexOf(b.talla));

    for (const p of productos) {
      await bot.sendMessage(chatId,
        `👕 Talla: ${p.talla}\n🎨 Color: ${p.color}\n💲 Precio 50u: $${p.precio_50_u}\n💲 Precio 100u: $${p.precio_100_u}\n💲 Precio 200u: $${p.precio_200_u}\n🏷️ Categoría: ${p.categoria}\n📝 Descripción: ${p.descripcion}`
      );
    }

    userState[chatId] = {};
    return mostrarMenuPrincipal(chatId);
  } catch (err) {
    console.error(err);
    return bot.sendMessage(chatId, '❌ Error al obtener productos.');
  }
}

});
