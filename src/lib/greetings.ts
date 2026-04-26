export function getPersonalizedGreeting(userName: string): string {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    const morningGreetings = [
      `Guten Morgen, ${userName} ☕ – ready to build?`,
      `Moin ${userName} 🌅 – lass uns rocken!`,
      `Hey ${userName} ☀️ – Zeit zu glänzen!`,
      `Servus ${userName} 🍳 – auf geht's!`
    ]
    return morningGreetings[Math.floor(Math.random() * morningGreetings.length)]
  }
  
  if (hour >= 12 && hour < 18) {
    const afternoonGreetings = [
      `Moin ${userName} 🌤️ – weiter so!`,
      `Hey ${userName} 💪 – keep pushing!`,
      `Hi ${userName} ⚡ – Zeit für Produktivität!`,
      `Servus ${userName} 🚀 – gas geben!`
    ]
    return afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)]
  }
  
  if (hour >= 18 && hour < 23) {
    const eveningGreetings = [
      `Abend, ${userName} 🌙 – noch am hustlen?`,
      `Hey ${userName} 🌆 – finish strong!`,
      `Moin ${userName} ✨ – letzter Spurt!`,
      `Hi ${userName} 🎯 – bring it home!`
    ]
    return eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)]
  }
  
  const nightGreetings = [
    `Noch wach, ${userName}? 🦉 – Respekt!`,
    `Late night grind, ${userName}? 🌃 – legend!`,
    `${userName} 🌙 – dedication level: 100!`,
    `Nachtschicht, ${userName}? 💯 – Respekt!`
  ]
  return nightGreetings[Math.floor(Math.random() * nightGreetings.length)]
}

export function getMotivationalMessage(stats: { hours?: number, expenses?: number }): string {
  if (stats.hours && stats.hours > 40) {
    return `${stats.hours.toFixed(1)} Stunden gerockt – stark! 💪`
  }
  if (stats.hours && stats.hours > 20) {
    return `${stats.hours.toFixed(1)} Stunden geschafft – weiter so! 🚀`
  }
  if (stats.expenses && stats.expenses > 1000) {
    return `${stats.expenses.toFixed(0)}€ investiert – big moves! 💎`
  }
  return 'Lass uns heute was bewegen! ⚡'
}
