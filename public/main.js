// phina.js をグローバル領域に展開
phina.globalize();

const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 640;
const COLORS = {
      bg:'#dfe0d8',
      frame:'#848a96',
      aframe:'red',
      0:'#9aadbe',
      1:'#934e61',
      2:'#4d639f',
      3:'#1d695f',
      4:'#844f30',
};
const COLORNUM = 4;
const TILENUM = 5;
const FIELDHEIGHT = SCREEN_HEIGHT * 0.9;
const FIELDWIDTH = FIELDHEIGHT;
const FIELDX = SCREEN_WIDTH/2;
const FIELDY = SCREEN_HEIGHT*0.5;
const TILEWIDTH = FIELDWIDTH*0.75/TILENUM;
const SPACEWIDTH = (FIELDWIDTH/TILENUM-TILEWIDTH);
const TILEHEIGHT = TILEWIDTH;
const VEC = {0: {x: 1, y: 0},
             1: {x: 0, y: 1},
             2: {x:-1, y: 0},
             3: {x: 0, y:-1},
           };

// MainScene クラスを定義
phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function(option) {
    this.superInit(option);
    // 背景色を指定
    this.backgroundColor = COLORS.bg;
    this.field=RectangleShape({
      width:FIELDWIDTH,
      height:FIELDHEIGHT,
      fill:COLORS[0],
      stroke:COLORS.frame,
      strokeWidth:10,
      cornerRadius:20,
    }).addChildTo(this).setPosition(FIELDX,FIELDY);

    this.colortable = new Array(TILENUM);
    for(let y = 0; y < TILENUM; y++){
      this.colortable[y] = new Array(TILENUM).fill(0);
    }
    this.tileGroup=DisplayElement().addChildTo(this);
    var self = this;
    for(let y = 0; y < TILENUM; y++){
      for(let x = 0; x < TILENUM; x++){
        let tilex = FIELDX - FIELDWIDTH/2 + TILEWIDTH/2 + SPACEWIDTH/2 + x * (TILEWIDTH + SPACEWIDTH);
        let tiley = FIELDY - FIELDHEIGHT/2 + TILEHEIGHT/2 + SPACEWIDTH/2 + y * (TILEWIDTH + SPACEWIDTH);
        let tile = Tile(x,y).addChildTo(self.tileGroup).setPosition(tilex,tiley);
        let flickable = Flickable().attachTo(tile);
        flickable.horizontal = false;
        flickable.vertical = false;
        flickable.onflickstart = function (e){
          let angle = e.direction.toAngle().toDegree()|0;
          angle += 45;
          angle %= 360;
          angle /= 90;
          angle = angle|0; // 右:0,下:1,左:2,上:3
          self.moveFunc(tile.tablex,tile.tabley,angle);
        }
      }
    }

    this.nextLabel = Label("Next:").setPosition(860,120).addChildTo(this);
    this.nextcolor=Math.floor(Math.random() * (COLORNUM)) + 1;
    this.nextTile = TileDesign().setPosition(860,200).addChildTo(this);
    this.nextTile.fill = COLORS[this.nextcolor];

    this.scoreLabel = Label("Score:").setPosition(100,120).addChildTo(this);
    this.scorenumLabel = Label("nya").setPosition(100,200).addChildTo(this);
    this.score = 0;

    this.initPuzzle();
    this.attach();
  },
  initPuzzle: function(){
    this.colortable[1][1]=Math.floor(Math.random() * (COLORNUM)) + 1;
    this.colortable[3][1]=Math.floor(Math.random() * (COLORNUM)) + 1;
    this.colortable[1][3]=Math.floor(Math.random() * (COLORNUM)) + 1;
    this.colortable[3][3]=Math.floor(Math.random() * (COLORNUM)) + 1;

    this.tnum=4;
  },
  attach: function(){
    this.attachColor();
    this.attachScore();
  },
  attachColor: function(){
    for(let y = 0; y < TILENUM; y++){
      for(let x = 0; x < TILENUM; x++){
        this.tileGroup.children[x+TILENUM*y].changeColor(this.colortable[x][y]);
      }
    }
  },
  moveFunc: function(x,y,angle){ // 右:0,下:1,左:2,上:3
    let t = this.movable(x,y,angle);
    if(!t)return 0;
    this.tnum+=1;
    this.movePiece(x,y,angle,t);
    this.checkLine();
  },
  movable: function(x,y,angle){
    if (this.colortable[x][y]==0)return 0;
    let check = function(i){
      if(0<=i && i <TILENUM)return true;
      return 0;
    }
    for(let t = 1; check(x + t * VEC[angle].x) && check(y + t * VEC[angle].y); t++){
      if(this.colortable[x + t * VEC[angle].x][y + t * VEC[angle].y]==0)return t;
    }
    return 0;
  },
  movePiece: function(x,y,angle,t){
    for(;t>0 ; t--){
      this.colortable[x+t*VEC[angle].x][y+t*VEC[angle].y]=this.colortable[x+(t-1)*VEC[angle].x][y+(t-1)*VEC[angle].y];
    }
    this.colortable[x][y]=this.nextcolor;
    this.prepareNext();
    this.attachColor();
  },
  prepareNext:function(){
    this.nextcolor=Math.floor(Math.random() * (COLORNUM)) + 1;
    this.nextTile.fill = COLORS[this.nextcolor];
  },
  attachScore: function(){
    this.scorenumLabel.text = '{0}'.format(this.score);
  },
  checkLine: function(){
    let flag = new Array(TILENUM);
    for(let i = 0; i < TILENUM; i++){
      flag[i] = new Array(TILENUM).fill(0);
    }
    for(let i = 1; i < TILENUM-1; i++){
      for(let j = 0; j < TILENUM; j++){
        if(this.colortable[i][j]!=0){
          if(this.colortable[i-1][j]==this.colortable[i][j] && this.colortable[i][j] == this.colortable[i+1][j]){
            for(let k=-1; k<=1; k++){
              flag[i+k][j]=1;
            }
          }
        }
        if(this.colortable[j][i]!=0){
          if(this.colortable[j][i-1]==this.colortable[j][i] && this.colortable[j][i] == this.colortable[j][i+1]){
            for(let k=-1; k<=1; k++){
              flag[j][i+k]=1;
            }
          }
        }
      }
    }
    var self = this;
    let score = 1;
    for(let i=0;i<TILENUM;i++){
      for(let j=0; j<TILENUM; j++){
        if(flag[i][j]==1){
          self.colortable[i][j]=0;
          score*=2;
          this.tnum-=1;
        }
      }
    }
    this.score += score;
    if(this.tnum == 0)self.initPuzzle();
    this.attach();
    if(this.tnum == 25)alert("game over");
  }

});

phina.define('Tile',{
  superClass:'TileDesign',
  init: function(tablex,tabley){
    this.superInit();
    this.color=0;
    this.tablex = tablex;
    this.tabley = tabley;
    this.fill = COLORS[this.color];
    this.setInteractive(true);
  },
  changeColor:function(color){
    this.color=color;
    this.fill=COLORS[this.color];
  },
  myColor:function(){
    return this.color;
  },
  onpointstart:function(){
    if(this.color!=0)this.stroke = COLORS.aframe;
  },
  onpointend:function(){
    this.stroke = COLORS.frame;
  }
});

phina.define('TileDesign',{
  superClass: 'RectangleShape',
  init: function(){
    this.superInit({width:TILEWIDTH,height:TILEHEIGHT,stroke:COLORS.frame,strokeWidth:10});
  }
});

// メイン処理
phina.main(function() {
  // アプリケーション生成
  var app = GameApp({
    startLabel: 'main', // メインシーンから開始する
    width: SCREEN_WIDTH,
    height:SCREEN_HEIGHT
  });
  // アプリケーション実行
  app.run();
});
