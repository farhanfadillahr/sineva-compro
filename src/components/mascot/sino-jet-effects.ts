import {
  AdditiveBlending,
  Color,
  ConeGeometry,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  NormalBlending,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  type Object3D,
} from 'three'
import { SINO_LOOK } from './sino-look'

/** Five extra draw calls, preallocated particles, no extra lights or postprocessing. */
export function createJetEffects(model: Object3D, parent: Object3D) {
  const sockets = ['FX-jet_L', 'FX-jet_R'].map((name) => model.getObjectByName(name))
  if (sockets.some((socket) => !socket)) return null
  const uniforms = {
    core: { value: new Color(SINO_LOOK.jet.core) },
    time: { value: 0 },
    color: { value: new Color(SINO_LOOK.jet.plasma) },
  }
  const flameMaterial = new ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    vertexShader:
      'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv;uniform float time;uniform vec3 color;uniform vec3 core;
      void main(){float n=.85+.15*sin(vUv.y*18.-time*6.28);
      float a=smoothstep(0.,.25,vUv.y)*(.5+.15*sin(time*12.56))*n;
      gl_FragColor=vec4(mix(color,core,vUv.y),a);}`,
  })
  const coreMaterial = flameMaterial.clone()
  coreMaterial.blending = AdditiveBlending
  const cone = new ConeGeometry(0.025, 0.16, 12)
  const cores: Mesh[] = []
  for (const socket of sockets) {
    const group = new Group()
    for (const [material, scale] of [
      [flameMaterial, 1],
      [coreMaterial, 0.55],
    ] as const) {
      const mesh = new Mesh(cone, material)
      mesh.rotation.z = Math.PI
      mesh.scale.set(scale, 1, scale)
      mesh.position.y = -0.08
      group.add(mesh)
      cores.push(mesh)
    }
    socket!.add(group)
  }

  const smokeGeometry = new PlaneGeometry(0.07, 0.07)
  const births = new Float32Array(24).fill(-100)
  smokeGeometry.setAttribute('born', new InstancedBufferAttribute(births, 1))
  const smokeMaterial = new ShaderMaterial({
    uniforms: { time: uniforms.time, color: { value: new Color(SINO_LOOK.jet.smoke) } },
    transparent: true,
    depthWrite: false,
    vertexShader: `attribute float born;varying float age;varying vec2 vUv;uniform float time;
      void main(){age=time-born;vUv=uv;vec4 p=instanceMatrix*vec4(position,1.);
      p.y+=max(0.,age)*.06;gl_Position=projectionMatrix*modelViewMatrix*p;}`,
    fragmentShader: `uniform vec3 color;varying float age;varying vec2 vUv;void main(){
      float a=(1.-smoothstep(.1,.5,length(vUv-.5)))*max(0.,1.-age/.8)*.22;
      if(age<0.||age>.8)discard;gl_FragColor=vec4(color,a);}`,
  })
  const smoke = new InstancedMesh(smokeGeometry, smokeMaterial, 24)
  smoke.frustumCulled = false
  parent.add(smoke)
  const point = new Vector3()
  const matrix = new Matrix4()
  let previous = 0
  let cursor = 0
  function puff(time: number) {
    model.getWorldPosition(point)
    parent.worldToLocal(point)
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6
      matrix.makeTranslation(
        point.x + Math.cos(angle) * 0.1,
        point.y + 0.025,
        point.z + Math.sin(angle) * 0.1,
      )
      smoke.setMatrixAt(cursor, matrix)
      births[cursor] = time
      cursor = (cursor + 1) % 24
    }
    smoke.instanceMatrix.needsUpdate = true
    smokeGeometry.attributes.born!.needsUpdate = true
  }
  return {
    update(time: number) {
      uniforms.time.value = time
      coreMaterial.uniforms.time!.value = time
      const thrust = sockets[0]!.scale.x
      if ((previous < 0.1 && thrust >= 0.1) || (previous > 0.6 && thrust <= 0.6)) puff(time)
      previous = thrust
    },
    dispose() {
      for (const mesh of cores) mesh.removeFromParent()
      smoke.removeFromParent()
      cone.dispose()
      flameMaterial.dispose()
      coreMaterial.dispose()
      smokeGeometry.dispose()
      smokeMaterial.dispose()
    },
  }
}
