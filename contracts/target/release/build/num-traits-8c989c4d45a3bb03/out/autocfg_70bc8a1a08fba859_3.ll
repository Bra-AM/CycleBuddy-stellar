; ModuleID = 'autocfg_70bc8a1a08fba859_3.b2a0b654e2d526c7-cgu.0'
source_filename = "autocfg_70bc8a1a08fba859_3.b2a0b654e2d526c7-cgu.0"
target datalayout = "e-m:o-i64:64-i128:128-n32:64-S128-Fn32"
target triple = "arm64-apple-macosx11.0.0"

; autocfg_70bc8a1a08fba859_3::probe
; Function Attrs: uwtable
define void @_ZN26autocfg_70bc8a1a08fba859_35probe17hfabbb1475ed3d3a4E() unnamed_addr #0 {
start:
  %0 = alloca [4 x i8], align 4
  store i32 1, ptr %0, align 4
  %_0.i = load i32, ptr %0, align 4
  ret void
}

; Function Attrs: nocallback nofree nosync nounwind speculatable willreturn memory(none)
declare i32 @llvm.cttz.i32(i32, i1 immarg) #1

attributes #0 = { uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }
attributes #1 = { nocallback nofree nosync nounwind speculatable willreturn memory(none) }

!llvm.module.flags = !{!0}
!llvm.ident = !{!1}

!0 = !{i32 8, !"PIC Level", i32 2}
!1 = !{!"rustc version 1.84.1 (e71f9a9a9 2025-01-27)"}
