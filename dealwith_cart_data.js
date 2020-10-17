// 一部自慢のコードを共有します。今でもこのコードを使用されています。
// shopping cart dataの整理に関するコードです。
//　nodeでバックエンドからのデータをフロントエンドで使うデータ構造によって整理して、フロントエンドにリターンします。
//　現在の開発工程で、バックエンドエンジニアはRESTful APIを作ります。（RESTの原則に則って構築されたWebシステムのHTTPでの呼び出しインターフェースのこと。）バックエンド（PHPやJavaなど）でビジネスロジックによってDBを使ってデータを保存します。バックエンドのデータは常にフロントエンドが欲しいデータ構造ではないので、フロントエンドの開発者自分で（nodeを使ったらnodeに、使わなかったらjsファイルに）画面を作るとき使えるデータを整理して、HTML templateまたはjsを使って、データをHTMLファイルに書いて、画面を生成します。
// リターンされたデータの中に、商品の種類たくさんがあります。

// 要望は下記になります。
// 1. カートに無効の商品灰色で展示します。
// 2. 有効の商品は２種類になって、2つ店舗のように分別で展示します。
// 3. 一つの種類のキャンペーンがある商品をカートで一緒に展示させます。一つの商品は一個以上のキャンペーンが持ってる状況もあります。
// 4. 並び順は新着順になります。
// 5. 商品名は一定的なルールにより画面で展示します。


// 整理购物车数据，用于返回购物车数据，传入后台返回的购物车数据json (カートのデータを整理すること。整理したデータをJSONデータにとして、フロントエンドにリターンすること。)
// 进行大前端整理、排序、归并处理后，通过api返回给ajax，再在前端渲染页面（データ整理して、ソートして、マージして、フロントエンド側Ajaxなどを通じてAPIからリターン値をもらって、画面をレンダすること。）
function settleShoppingListData(val) {

  // 如果传入数据有误，直接返回null（引数が間違った時、Nullをリターンする。このvalはバックエンドからのデータ。）
  if (!val) return null;

  // 如果后台返回数据有误, 直接返回data（バックエンドからのステータスは間違った時、バックエンド提供したデータをリターンする。このようなエラーは常にリクエストを出す時、paramsが間違えた時は多い。）
  if (val.status < 0) return val.data;

  //　必要な変数を準備しておく
  let products = val.data.items; 
  let activities = val.data.activities;
  let sum = products.length;
  let price = val.data.pay_amount;
  let oldmusic = val.data.oldmusic;
  let activeId;
  let finalArr = [];
  let len = products.length;
  let inValidIds = [];

  // 抽出所有的已经失效商品 (全ての無効商品「販売されていない商品」を取って、productsという変数に保存する)
  products = products.map(item => {
    if(!item.is_onshelf) {
      inValidIds.push(item.id);
      item.choosen = 0;
    }
    return item;
  });

  // 再帰関数でデータをソートする
  function reSortList(messArr) {
    if (finalArr.length === len) return; //排好序的arr长度等于购物车所有商品的长度时候，return

    for (let i = 0; i < messArr.length; i++) {
      if (!messArr[i].activity_id) {
        // 沒有activity的話就直接放进finalArr里，activity_id为0
        finalArr.push(messArr[i]);
        messArr.splice(i, 1);
        i--;
      } else {
        activeId = messArr[i].activity_id;
        break;
      }
    }

    let activeArr = messArr.filter(function (single) {
      if (single.activity_id) {
        return single.activity_id === activeId;
      }
    });

    let leftArr = messArr.filter(function (single) {
      return !single.activity_id || single.activity_id !== activeId;
    });

    finalArr = finalArr.concat(activeArr);
    reSortList(leftArr);
  }

  if (products.length === 0) {
    return {
      sum: 0
    };
  } else {
    products.forEach(function (item) {
      item.images = toHTTPS(item.images);
    });

    reSortList(products);

    //商品类别顺序数组，前端拿到这个数组，按照这个数组取出类别，渲染html（商品のカテゴリの順位。並び順は新着順なので、カートに一位の商品は一番遅いカートに入れた商品、なので、この商品のカテゴリは一位になる。）
    let classSequence = [];

    let wholeProducts = {};

    finalArr.forEach(function (item) {
      classSequence.push(item.platform_id);
      wholeProducts[item.platform_id] = finalArr.filter(function (thisArr) {
        return thisArr.platform_id == item.platform_id;
      });
    });

    // 去重 platformid, 后添加到购物车的素材，其platformid下的素材显示在前面
    classSequence =  [...new Set(classSequence)];

    //把活动信息整理成{}以便用活动id作为key查询
    let reArrangedActives = {};
    if (activities.length > 0) {
      activities.forEach(function (activity) {
        reArrangedActives[activity.id] = activity;
      });
    }


    let classChoosen = {},
      wholeChoosen = 1,
      chooseSum = 0,
      arrangedList = {};
    for (let key in wholeProducts) {
      arrangedList[key] = [];
      let activityId;
      let activityTemp = {};
      // let index;
      classChoosen[key] = {};
      classChoosen[key].isChoosen = 1;
      classChoosen[key].selected = 0;
      wholeProducts[key].forEach(function (item, ind) {
        if (item.is_onshelf) {
          classChoosen[key].isChoosen *= item.choosen;
        }
        classChoosen[key].selected += item.choosen;
        chooseSum += item.choosen;
      });

      if (classChoosen[key].selected == 0) {
        classChoosen[key].isChoosen = 0;
      }
      wholeProducts[key].forEach(function (item, ind) {
        if (item.activity_id) {
          if (activityId != item.activity_id) {
            // index = ind;
            activityId = item.activity_id;
            activityTemp[activityId] = {};
            activityTemp[activityId].aID = item.activity_id;
            if (activities.length > 0) {
              activityTemp[activityId].content = activities.filter(function (activity) {
                // console.log(activity.id, activeId);
                return activity.id == activityId;
              });
            }
            //把活动的id作为key存在这个对象里，相匹配id的item都作为这个key的value
            activityTemp[activityId].list = [];
            //把这个对象的这一条子对象作为一个数组的项，添加到第一次出现这个活动id的位置
            arrangedList[key].push(activityTemp[activityId]);
            activityTemp[activityId].list.push(item);
          } else {
            // 把这条数据push到这个对象的list里
            activityTemp[activityId].list.push(item);
          }
        } else {
          arrangedList[key].push(item);
        }
      });

    }
    for (let key in classChoosen) {
      if (wholeProducts[key].length > 1 || wholeProducts[key].some(item => item.is_onshelf)) {
        wholeChoosen *= classChoosen[key].isChoosen;
      }
    }
    wholeProducts = null;
    for (let i = 0; i < classSequence.length; i++) {
      let classKey = classSequence[i];
      arrangedList[classKey].forEach(function (item) {
        if (item.id) {
          item.skuDesc = [];
          if (classKey == 2) {
            for (let l in item.sku_value) {
              if (l != 'purpose') item.skuDesc.push(item.sku_value[l].text);
            }
          } else if (classKey == 6) {
            // 对pond5的视频description进行处理（商品の動画のratioを処理する）
            let ratio = '';
            for (let l in item.sku_value) {
              if (l === 'size' || l === 'pic_file_extension') {
                item.skuDesc.push(item.sku_value[l]);
              } else if (l === 'ox') {
                ratio = item.sku_value[l] + ' x ';
              } else if (l === 'oy') {
                ratio += item.sku_value[l];
              } else if (l === 'pim_aut_fps_real') {
                ratio += '@' + item.sku_value[l] + 'fps';
              }
            }
            item.skuDesc.splice(1, 0, ratio);
            item.skuDesc = Array.from(new Set(item.skuDesc)).filter(item => !!item);
          } else if (classKey == 7) {
            for (let l in item.sku_value.sku_detail) {
              item.skuDesc.push(item.sku_value.sku_detail[l].text);
            }
          } else if (classKey == 8 || classKey == 9) {
            const sku_value = item.sku_value;
            const sku_detail = sku_value.sku_detail;
            item.skuDesc = sku_value.size + ' | ' + (sku_value.pii_width && sku_value.pii_width != -1 ? sku_value.pii_width + '*' + sku_value.pii_height + '/' : '') + filter.toUpperCase(item.sku_value.pic_file_extension) + ' | ' + sku_detail.expire.license_type + ' | ' + sku_value.sku_detail.area.text + '/' + sku_detail.expire.text;
          } else if (classKey == 11) {
            const sku_value = item.sku_value;
            item.skuDesc = '要求'+ sku_value.pic_media_source +'及更高版本';
          } else {
            for (let l in item.sku_value) {
              item.skuDesc.push(item.sku_value[l]);
            }
          }

        } else if (item.aID) {
          item.list.forEach(function (single) {
            single.skuDesc = [];
            if (classKey == 2) {
              for (let l in single.sku_value) {
                if (l != 'purpose') single.skuDesc.push(single.sku_value[l].text);
              }
            } else {
              for (let l in single.sku_value) {
                single.skuDesc.push(single.sku_value[l]);
              }
            }

          });
        }
      });

    }
    return {
      sum,
      arrangedList,
      classSequence,
      classChoosen,
      wholeChoosen,
      chooseSum,
      inValidIds,
      reArrangedActives,
      price,
      oldmusic
    };
  }

}
