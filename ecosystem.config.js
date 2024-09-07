module.exports = {
  apps: [
    {
      name: 'FesMoa-api', // 프로세스 이름
      script: './dist/main.js', // 스크립트는 main.js 사용
      cwd: './', // 현재 디렉토리
      // exec_mode: 'cluster', // 여러 프로세스 생성, 애플리케이션을 병렬로 실행 , 기본은 fork
      // instances: 0, //  인스턴스 수, 0 = 'max'(모든 CPU 코어 사용)와 동일
      // merge_logs: true, // 클러스터 모드 사용시 각 클러스터에서 생성되는 로그를 한 파일로 합쳐준다
      // watch: true, // 파일 변경 시 재시작 , 특정 디렉토리나 파일만 감시 watch: ['src', 'dist'],
    },
  ],
};
