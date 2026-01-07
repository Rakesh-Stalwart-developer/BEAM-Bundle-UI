import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useState} from 'preact/hooks';

// 🔒 GLOBAL DEDUPE (NO HOOKS)
globalThis.__renderedProducts ||= new Set();


const PRODUCT_FREE_GIFTS_QUERY = `#graphql
query ProductFreeGifts($id: ID!) {
  product(id: $id) {
    metafield(namespace: "custom", key: "bundle_items") {
      references(first: 20) {
        nodes {
          ... on Metaobject {
            id
            title: field(key: "title") { value }
            image: field(key: "image") {
              reference {
                ... on MediaImage {
                  image { url }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

export default () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const merchandise = shopify.target?.current?.merchandise;
  const productId = merchandise?.product?.id;

  useEffect(() => {
    if (!productId) return;
    if (hasStarted) return;

    setHasStarted(true);
    load();
  }, [productId, hasStarted]);

  async function load() {
    try {
      const result = await shopify.query(PRODUCT_FREE_GIFTS_QUERY, {
        variables: { id: productId },
      });

      const refs =
        result?.data?.product?.metafield?.references?.nodes || [];
      const unique = Array.from(
        new Map(refs.map(i => [i.id, i])).values()
      );

      setItems(unique);
      setLoaded(true);
    } catch (e) {
      console.error(e);
      setLoaded(true);
    }
  }

  if (!loaded || !items.length) return null;

  return (
    <s-box background="none">
      <s-stack gap="small">
        {items.map(item => (
          <s-grid
            key={item.id}
            gridTemplateColumns="auto 1fr auto"
            gap="small"
            alignItems="center"
          >
            <s-grid-item>
              {item.image?.reference?.image?.url && (
                <s-product-thumbnail
                  src={item.image.reference.image.url}
                  size="small"
                />
              )}
            </s-grid-item>

            <s-grid-item>
              <s-text size="small">{item.title?.value}</s-text>
            </s-grid-item>

            <s-grid-item>
              <s-text size="small" emphasis="strong">
                FREE
              </s-text>
            </s-grid-item>
          </s-grid>
        ))}
      </s-stack>
    </s-box>
  );
}

 