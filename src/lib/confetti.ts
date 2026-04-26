// Simple confetti animation without external dependencies
export function triggerConfetti() {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899']

  const interval: any = setInterval(function () {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    // Create confetti particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      particle.className = 'confetti-particle'
      particle.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background-color: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${randomInRange(0, 100)}%;
        top: -20px;
        opacity: 1;
        transform: rotate(${randomInRange(0, 360)}deg);
        z-index: 9999;
        pointer-events: none;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0%'};
        animation: confetti-fall ${randomInRange(2, 4)}s linear forwards;
      `
      document.body.appendChild(particle)

      setTimeout(() => {
        particle.remove()
      }, 4000)
    }
  }, 250)

  // Add animation CSS if not exists
  if (!document.getElementById('confetti-styles')) {
    const style = document.createElement('style')
    style.id = 'confetti-styles'
    style.textContent = `
      @keyframes confetti-fall {
        to {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }
}
