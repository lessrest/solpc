let assert = require("assert")

if (process.argv.length != 2 + 3) {
  console.error("Solidity program counter calculator\n")
  console.error("Usage: solpc <srcfile> <contract> <pc>\n")
  console.error("Expects `solc --combined-json=asm` on stdin")
  process.exit(1)
}

let jsondata = ""
process.stdin.on("readable", () => {
  jsondata += process.stdin.read() || ""
})
process.stdin.on("end", () => {
  solpc({
    solc: JSON.parse(jsondata),
    source: require("fs").readFileSync(process.argv[2]),
    contractName: process.argv[3],
    pc: +process.argv[4],
  })
})

function solpc(args) {
  let contract = args.solc["contracts"][args.contractName]
  let asm = contract["asm"][".data"]["0"][".code"]
  let pc = 0
  let instruction
  while (instruction = asm.shift()) {
    let offset = 0
    if (instruction.name != "tag") {
      offset++
      if (["PUSH", "PUSH [$]", "PUSH #[$]"].includes(instruction.name))
        offset += Math.ceil(instruction.value.length / 2)
      else if (["PUSH [tag]", "PUSH [ErrorTag]"].includes(instruction.name))
        offset += 2
    }

    if (pc + offset > args.pc + 1)
      break
    else
      pc += offset
  }
  console.log(`${instruction.begin}-${instruction.end}`)

  let slice = args.source.slice(
    instruction.begin - 250, instruction.end
  ).toString().replace(/[^\n]+\n/, "")
  console.log(`...\n${slice}...`)
  
  // let pcs = makeOpcodeOffsetTable(contract["opcodes"])
  // let srcmap = parseSourceMap(contract["srcmap-runtime"])
  // console.log({ instruction: pcs[args.pc] })
  // console.log(srcmap[pcs[args.pc]])
  // console.log(srcmap)
}

// function makeOpcodeOffsetTable(s) {
//   let i = 0
//   let table = {}
//   s.split(" ").filter(x => !x.match(/^0x/)).forEach((x, j) => {
//     table[i] = j
//     i += x.match(/^PUSH(\d+)$/) ? 1 + +RegExp.$1 : 1
//   })
//   return table
// }

// function parseSourceMap(s) {
//   let offset, span, index, jump
//   return s.split(";").map(x => x.split(":")).map(xs => ({
//     offset: offset = (xs.shift() || offset),
//     span: span = (xs.shift() || span),
//     index: index = (xs.shift() || index),
//     jump: jump = (xs.shift() || jump),
//   }))
// }