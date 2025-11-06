import React, { useEffect, useRef } from 'react';

// Canvas particle spinner translated from the provided vanilla JS
// Usage: <Spinner width={300} height={300} />
export default function Spinner({ width = 300, height = 300, className = '', style = {} }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const DPR = window.devicePixelRatio || 1;

    // sizing
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(DPR, DPR);

    ctx.globalCompositeOperation = 'lighter';

    const PI = Math.PI;
    const TAU = PI * 2;

    const particles = [];
    let globalAngle = 0;
    let tick = 0;
    let now = 0;
    let frameDiff = 0;
    let lastFrame = Date.now();

    class Particle {
      constructor(opt) {
        this.x = opt.x;
        this.y = opt.y;
        this.angle = opt.angle;
        this.speed = opt.speed;
        this.accel = opt.accel;
        this.radius = 7;
        this.decay = 0.01;
        this.life = 1;
      }

      step(i) {
        this.speed += this.accel;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.angle += PI / 64;
        this.accel *= 1.01;
        this.life -= this.decay;

        if (this.life <= 0) {
          particles.splice(i, 1);
        }
      }

      draw(i) {
        ctx.fillStyle = `hsla(${tick + this.life * 120}, 100%, 60%, ${this.life})`;
        ctx.strokeStyle = `hsla(${tick + this.life * 120}, 100%, 60%, ${this.life})`;

        ctx.beginPath();
        if (particles[i - 1]) {
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(particles[i - 1].x, particles[i - 1].y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.001, this.life * this.radius), 0, TAU);
        ctx.fill();

        const size = Math.random() * 1.25;
        ctx.fillRect(
          Math.trunc(this.x + (Math.random() - 0.5) * 35 * this.life),
          Math.trunc(this.y + (Math.random() - 0.5) * 35 * this.life),
          size,
          size
        );
      }
    }

    const min = width * 0.5;

    function step() {
      particles.push(
        new Particle({
          x: width / 2 + Math.cos(tick / 20) * (min / 2),
          y: height / 2 + Math.sin(tick / 20) * (min / 2),
          angle: globalAngle,
          speed: 0,
          accel: 0.01,
        })
      );

      for (let i = 0; i < particles.length; i++) {
        particles[i].step(i);
      }

      globalAngle += PI / 3;
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].draw(i);
      }
    }

    function loop() {
      rafRef.current = window.requestAnimationFrame(loop);
      now = Date.now();
      frameDiff = now - lastFrame;
      if (frameDiff >= 1000 / 60) {
        lastFrame = now;
        step();
        draw();
        tick++;
      }
    }

    // start
    loop();

    return () => {
      // cleanup
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      particles.length = 0;
    };
  }, [width, height]);

  return (
    <div
      className={className}
      style={{ display: 'inline-block', width: width + 'px', height: height + 'px', overflow: 'hidden', ...style }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
