import { PresentationData, UserProfile } from './types';

export const DEFAULT_USER: UserProfile = {
  id: 'usr-farmacia-1',
  email: 'farmacia.docente@universidad.edu',
  name: 'Docente Farmacia',
  role: 'Profesor / Expositor'
};

export const DEFAULT_PRESENTATION: PresentationData = {
  id: 'pres-glucometros-01',
  title: 'Glucómetros',
  subject: 'Tecnología Farmacéutica y Control Glucémico',
  presenters: ['Expositora 1', 'Expositora 2'],
  ownerId: 'usr-farmacia-1',
  ownerName: 'Docente Farmacia',
  ownerEmail: 'farmacia.docente@universidad.edu',
  isPublic: true,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-02T12:00:00.000Z',
  // Customizable Google Slides URL
  googleSlidesEmbedUrl: 'https://docs.google.com/presentation/d/e/2PACX-1vT1Z5fO9U38Hglz8T9fGvdY_bYxL_YtQ5n0aTvhZ1-4UeWvLgQeZk8w7f1_9Nf_XG0o3iW1R2_8/embed?start=false&loop=false&delayms=3000',
  slides: [
    {
      id: 'slide-1',
      slideNumber: 1,
      title: 'Principios de Funcionamiento y Biosensores',
      shortDescription: 'Tecnología enzimática amperométrica y medición de corriente eléctrica proporcional a la glucemia.',
      keyPoints: [
        'Tecnología electroquímica de detección amperométrica',
        'Reacción enzimática específica (Glucosa Oxidasa vs. Glucosa Deshidrogenasa)',
        'Medición de microcorriente eléctrica proporcional a la glucemia',
        'Resultados cuantitativos precisos en pocos segundos'
      ],
      notes: 'Explicar cómo la enzima reacciona con la glucosa y transfiere electrones al electrodo.',
      detailedTopic: 'Biosensores electroquímicos y tecnología enzimática',
      fullExplanation: 'Los glucómetros modernos son dispositivos médicos portátiles basados en biosensores electroquímicos. Cuando se deposita la gota de sangre capilar en la tira reactiva, la glucosa presente reacciona con una enzima inmovilizada (como la glucosa oxidasa o la glucosa deshidrogenasa). Esta reacción genera una transferencia de electrones mediada por un compuesto químico (mediador redox) hacia los electrodos de la tira. El glucómetro aplica un potencial eléctrico constante y cuantifica la intensidad de corriente generada (técnica amperométrica), la cual es directamente proporcional a la concentración de glucosa en la muestra.',
      practicalExamples: [
        'Tiras con enzima Glucosa Oxidasa (GOD): Muy específicas para glucosa, pero sensibles a la presión parcial de oxígeno en sangre.',
        'Tiras con Glucosa Deshidrogenasa (GDH): No se ven afectadas por la oxigenación, ideales para pacientes con afecciones respiratorias o a diferentes altitudes.'
      ],
      keyTerms: []
    },
    {
      id: 'slide-2',
      slideNumber: 2,
      title: 'Tiras Reactivas y Conservación',
      shortDescription: 'Estructura multicapa, sensibilidad a la humedad ambiente y normas de conservación farmacéutica.',
      keyPoints: [
        'Estructura multicapa con canal capilar de absorción rápida',
        'Desecantes activos integrados en las paredes del envase original',
        'Alta sensibilidad a la humedad ambiente, temperatura y luz',
        'Periodo de caducidad estricto tras la primera apertura'
      ],
      notes: 'Enfatizar la importancia de cerrar el frasco inmediatamente tras extraer una tira.',
      detailedTopic: 'Composición, estabilidad y conservación de tiras reactivas',
      fullExplanation: 'Las tiras reactivas son componentes biotecnológicos de alta precisión formados por capas de polímeros, electrodos de metales conductores, reactivos enzimáticos liofilizados y una cámara capilar que aspira el volumen exacto de sangre (0.5 a 1.0 µL). Su estabilidad es sumamente delicada: deben conservarse siempre en su frasco original con tapón desecante hermético, a temperaturas entre 4°C y 30°C, lejos de la luz solar directa y la humedad. Una vez abierto el frasco, el tiempo de vida útil debe respetarse rigurosamente (generalmente 90 a 180 días) para evitar lecturas erróneas por desnaturalización de la enzima.',
      practicalExamples: [
        'Guardar las tiras en el botiquín del baño suele dañarlas rápidamente debido al vapor y la humedad acumulada de las duchas.',
        'Dejar el envase destapado hidrata prematuramente los reactivos químicos, arrojando errores de lectura o valores falsamente disminuidos.'
      ],
      keyTerms: []
    },
    {
      id: 'slide-3',
      slideNumber: 3,
      title: 'Técnica de Punción y Toma de Muestra',
      shortDescription: 'Preparación de la piel, lavado con agua tibia, evaporación de alcohol y punción lateral.',
      keyPoints: [
        'Lavado de manos previo con agua templada y jabón neutro',
        'Evitar restos de alcohol húmedo o azúcares de alimentos en la piel',
        'Punción en las caras laterales de la yema de los dedos',
        'No exprimir excesivamente la zona para evitar dilución intersticial'
      ],
      notes: 'Demostrar la técnica adecuada de rotación de dedos para evitar callosidades y dolor crónico.',
      detailedTopic: 'Procedimiento de medición y buenas prácticas del paciente',
      fullExplanation: 'Para garantizar un resultado fidedigno, el paciente debe lavarse las manos con agua templada y jabón neutro, secándose completamente. Si se utiliza alcohol para desinfectar, debe dejarse evaporar por completo antes de puncionar, ya que el alcohol residual hemoliza la muestra y altera la reacción química. La punción debe realizarse en las caras laterales de las yemas de los dedos (donde hay menor densidad de terminaciones nerviosas y mejor flujo capilar). Se debe desechar o colocar la gota según la especificación del fabricante, sin ordeñar ni apretar con fuerza el dedo, ya que esto diluye la sangre con líquido intersticial y falsea el valor de glucemia.',
      practicalExamples: [
        'Haber manipulado una fruta o dulce y no lavarse las manos antes del pinchazo puede registrar hiperglucemias artificiales mayores a 250 mg/dL.',
        'Puncionar el centro exacto de la yema provoca mayor dolor y pérdida gradual de la sensibilidad táctil con el paso de los meses.'
      ],
      keyTerms: []
    },
    {
      id: 'slide-4',
      slideNumber: 4,
      title: 'Factores de Interferencia y Control de Calidad',
      shortDescription: 'Efecto del hematocrito, interferencias farmacológicas y validación con soluciones de control.',
      keyPoints: [
        'Variaciones en el hematocrito (anemia o policitemia)',
        'Sustancias interferentes endógenas y exógenas (ácido ascórbico, paracetamol)',
        'Uso de soluciones de control de glucosa para validación periódica',
        'Codificación automática vs. calibración manual del lote'
      ],
      notes: 'Mencionar cuándo se debe orientar al paciente a utilizar la solución de control.',
      detailedTopic: 'Fuentes de error, calibración y control de calidad',
      fullExplanation: 'Diversas variables clínicas y ambientales pueden alterar la exactitud del glucómetro. Un hematocrito bajo (anemia) suele sobreestimar la glucosa, mientras que un hematocrito alto (policitemia o deshidratación severa) tiende a subestimarla. Fármacos y suplementos en dosis elevadas (como la vitamina C o el paracetamol) pueden actuar como reductores electroquímicos e inducir lecturas falsamente elevadas. El control de calidad farmacéutico debe realizarse periódicamente utilizando soluciones de control de glucosa estándar al abrir un lote nuevo de tiras, si el glucómetro sufre un golpe o caída, o cuando los resultados no concuerden con los síntomas clínicos del paciente.',
      practicalExamples: [
        'Utilizar una solución de control con rango conocido (ej. 95-125 mg/dL) para certificar que el lector y el lote de tiras midan correctamente.',
        'Comprender la diferencia fisiológica de 10-15% entre glucosa plasmática venosa de laboratorio y glucosa capilar de sangre total en glucómetros domiciliarios.'
      ],
      keyTerms: []
    }
  ],
  quiz: [
    {
      id: 'q-1',
      topic: 'Glucómetros',
      question: '¿Cuál es el principio electroquímico fundamental mediante el cual operan la mayoría de los glucómetros portátiles actuales?',
      options: [
        'Miden la temperatura corporal transmitida a la tira reactiva',
        'Biosensores que cuantifican la corriente eléctrica producida por la reacción enzimática de la glucosa (amperometría)',
        'Calculan el peso molecular de la gota de sangre por gravedad',
        'Analizan la presión arterial capilar del dedo del paciente'
      ],
      correctAnswerIndex: 1,
      explanation: 'Los glucómetros utilizan biosensores electroquímicos donde una enzima reacciona con la glucosa y produce un flujo de electrones proporcional a su concentración, medido mediante amperometría.',
      reinforcementTip: 'Revisar la tarjeta sobre Principios de Funcionamiento y Biosensores.'
    },
    {
      id: 'q-2',
      topic: 'Glucómetros',
      question: '¿Por qué es fundamental dejar que el alcohol se evapore por completo antes de realizar la punción capilar?',
      options: [
        'Porque el alcohol frío apaga la pantalla digital del glucómetro',
        'Porque el alcohol no tiene ningún efecto en la sangre',
        'Porque los restos de alcohol húmedo provocan hemólisis y diluyen la muestra, falseando la lectura',
        'Porque el alcohol vuelve la sangre completamente invisible para el sensor'
      ],
      correctAnswerIndex: 2,
      explanation: 'El alcohol remanente en la piel hemoliza los glóbulos rojos y diluye químicamente la muestra de sangre, originando lecturas erróneas y artefactos en la medición.',
      reinforcementTip: 'Revisar la técnica correcta de punción y preparación de la piel.'
    },
    {
      id: 'q-3',
      topic: 'Glucómetros',
      question: '¿Qué consecuencia clínica y analítica tiene exprimir o presionar con excesiva fuerza el dedo tras la punción?',
      options: [
        'Provoca la liberación de líquido intersticial que diluye la muestra y falsea el resultado',
        'Aumenta la cantidad de glóbulos rojos de forma permanente',
        'Descalibra el reloj interno del dispositivo',
        'No produce ninguna alteración en la muestra'
      ],
      correctAnswerIndex: 0,
      explanation: 'Apretar o "ordeñar" fuertemente el dedo hace que el líquido intersticial tisular se mezcle con la sangre capilar, disminuyendo artificialmente la concentración medida de glucosa.',
      reinforcementTip: 'Revisar las pautas de toma de muestra capilar.'
    },
    {
      id: 'q-4',
      topic: 'Glucómetros',
      question: '¿Cómo afecta un hematocrito significativamente bajo (anemia severa) a la lectura de un glucómetro tradicional?',
      options: [
        'Hace que el dispositivo muestre siempre 0 mg/dL',
        'Tiende a sobreestimar el valor real de la glucemia',
        'Bloquea la entrada de la tira reactiva',
        'Tiende a subestimar el valor de la glucemia de manera crítica'
      ],
      correctAnswerIndex: 1,
      explanation: 'Con menor volumen eritrocitario (anemia), hay una mayor proporción de plasma que difunde más rápido hacia la enzima de la tira, lo que suele sobreestimar el resultado de glucosa en glucómetros no corregidos por hematocrito.',
      reinforcementTip: 'Revisar los factores de interferencia fisiológicos y farmacológicos.'
    },
    {
      id: 'q-5',
      topic: 'Glucómetros',
      question: '¿En cuál de las siguientes situaciones está indicado realizar un control de calidad con solución de control de glucosa?',
      options: [
        'Únicamente cuando se agota la batería del glucómetro',
        'Al abrir un nuevo frasco de tiras reactivas, tras caídas del equipo o cuando los resultados no coincidan con la clínica del paciente',
        'Cada vez que el paciente come un alimento con azúcar',
        'Solo una vez cada 5 años de uso continuo'
      ],
      correctAnswerIndex: 1,
      explanation: 'Las soluciones de control permiten verificar que el sistema (lector + lote de tiras específico) funcione dentro del rango de tolerancia exacto establecido por el fabricante.',
      reinforcementTip: 'Revisar las buenas prácticas de control de calidad farmacéutico.'
    }
  ]
};
